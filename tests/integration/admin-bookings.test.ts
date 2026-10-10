import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { listAdminBookings } from '../../server/features/admin/bookings/booking.service.ts'
import type { AdminBookingDetailResponse, AdminBookingListResponse } from '../../shared/api/admin-bookings.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { provisionTestAdmin, signInAs, adminFetch } from '../support/admin-fixtures.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { registerCustomer } from '../support/customer-fixtures.ts'

const HOUR = 60 * 60 * 1000
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let auth: Awaited<ReturnType<typeof signInAs>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>

beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' }))
  auth = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma))
})
afterAll(async () => { await server?.close(); await db?.cleanup() })

async function book(sessionId: string, names: string[], deadline: Date, extra: { customerId?: string; actorKind?: string; status?: string; createdAt?: Date } = {}) {
  return db.prisma.booking.create({ data: {
    sessionId, customerId: extra.customerId ?? null, actorKind: extra.actorKind ?? 'customer', actorId: extra.customerId ?? 'admin-1', status: extra.status ?? 'awaiting_payment',
    createRequestId: crypto.randomUUID(), fingerprint: 'test', bookerName: names[0]!, bookerPhone: '+6281200000001', quantity: names.length,
    unitPriceIdr: 100000, totalPriceIdr: 100000 * names.length, originalDeadline: deadline, createdAt: extra.createdAt ?? new Date(),
    participants: { create: names.map((name, index) => ({ position: index + 1, name })) },
  } })
}

test('unpaid bookings come nearest deadline first, page by cursor, and lapsed ones drop out', async () => {
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 48 * HOUR) })
  const now = new Date()
  const late = await book(session.id, ['Late'], new Date(now.getTime() + 4 * HOUR))
  const soon = await book(session.id, ['Soon'], new Date(now.getTime() + HOUR))
  const middle = await book(session.id, ['Middle'], new Date(now.getTime() + 2 * HOUR), { actorKind: 'admin' })
  await book(session.id, ['Lapsed'], new Date(now.getTime() - HOUR))

  const first = await listAdminBookings(db.prisma, { filter: 'unpaid', cursor: null, limit: 2 }, now)
  expect(first.items.map(item => item.id)).toEqual([soon.id, middle.id])
  expect(first.items[1]).toMatchObject({ source: 'admin', status: 'awaiting_payment' })
  expect(first.unpaidCount).toBe(3)
  const second = await listAdminBookings(db.prisma, { filter: 'unpaid', cursor: first.nextCursor, limit: 2 }, now)
  expect(second.items.map(item => item.id)).toEqual([late.id])
  expect(second.nextCursor).toBeNull()
  const all = await listAdminBookings(db.prisma, { filter: 'all', cursor: null, limit: 50 }, now)
  expect(all.items.find(item => item.bookerName === 'Lapsed')?.status).toBe('expired')
})

test('admins only: list and detail with players, account and no-store; unknown is 404', async () => {
  const customer = await registerCustomer(server.baseUrl, '+6281234590001', 'Andy')
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 48 * HOUR) })
  const booking = await book(session.id, ['Andy', 'Dmitri'], new Date(Date.now() + 3 * HOUR), { customerId: customer.customerId })

  expect((await fetch(server.baseUrl + '/api/admin/bookings')).status).toBe(401)
  const listResponse = await adminFetch(server.baseUrl, auth, '/bookings')
  expect(listResponse.headers.get('cache-control')).toBe('no-store')
  const list = await listResponse.json() as AdminBookingListResponse
  expect(list.items.some(item => item.id === booking.id)).toBe(true)

  const detail = await (await adminFetch(server.baseUrl, auth, `/bookings/${booking.id}`)).json() as AdminBookingDetailResponse
  expect(detail.booking).toMatchObject({ id: booking.id, participants: ['Andy', 'Dmitri'], quantity: 2, source: 'customer', customer: { displayName: 'Andy' } })
  expect(detail.booking.session).toMatchObject({ id: session.id, cancelled: false })
  expect((await adminFetch(server.baseUrl, auth, '/bookings/unknown123')).status).toBe(404)
  expect((await adminFetch(server.baseUrl, auth, '/bookings?status=everything')).status).toBe(400)
})
