import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { expireDueBookings } from '../../server/features/booking-expiry/expiry.service.ts'
import { getMyBooking, listMyBookings } from '../../server/features/customer/my-bookings/my-bookings.service.ts'
import { getOccupiedPlaceCounts } from '../../server/features/capacity/occupancy.ts'
import type { CustomerBookingListResponse } from '../../shared/api/customer-bookings.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { registerCustomer } from '../support/customer-fixtures.ts'

const HOUR = 60 * 60 * 1000
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
let phoneIndex = 5000
const phone = () => '+628123457' + String(phoneIndex++)

beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' }))
})
afterAll(async () => { await server?.close(); await db?.cleanup() })

async function book(customerId: string | null, sessionId: string, names: string[], deadline: Date, createdAt = new Date()) {
  return db.prisma.booking.create({ data: {
    sessionId, customerId, actorId: customerId ?? 'admin', createRequestId: crypto.randomUUID(), fingerprint: 'test',
    bookerName: names[0]!, bookerPhone: '+6281200000000', quantity: names.length, unitPriceIdr: 100000, totalPriceIdr: 100000 * names.length,
    originalDeadline: deadline, createdAt, participants: { create: names.map((name, index) => ({ position: index + 1, name })) },
  } })
}

const get = (path: string, cookie = '') => fetch(server.baseUrl + '/api/customer' + path, { headers: { Origin: server.baseUrl, Accept: 'application/json', Cookie: cookie } })

test('a customer sees only their own bookings, upcoming nearest first, and others answer 404', async () => {
  const me = await registerCustomer(server.baseUrl, phone(), 'Andy')
  const other = await registerCustomer(server.baseUrl, phone(), 'Dmitri')
  const now = Date.now()
  const later = await createSampleSession(db.prisma, { catalog, startsAt: new Date(now + 72 * HOUR) })
  const sooner = await createSampleSession(db.prisma, { catalog, startsAt: new Date(now + 30 * HOUR) })
  const mineLater = await book(me.customerId, later.id, ['Andy', 'Teman'], new Date(now + 4 * HOUR))
  const mineSooner = await book(me.customerId, sooner.id, ['Andy'], new Date(now + 2 * HOUR))
  const theirs = await book(other.customerId, sooner.id, ['Dmitri'], new Date(now + 2 * HOUR))

  const response = await get('/bookings?view=upcoming', me.cookie)
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('no-store')
  const body = await response.json() as CustomerBookingListResponse
  expect(body.items.map(item => item.id)).toEqual([mineSooner.id, mineLater.id])
  expect(body.items[1]).toMatchObject({ status: 'awaiting_payment', quantity: 2, participants: ['Andy', 'Teman'], totalPriceIdr: 200000 })
  expect(body.items[1].session).toMatchObject({ id: later.id, cancelled: false })

  expect((await get(`/bookings/${theirs.id}`, me.cookie)).status).toBe(404)
  expect((await get('/bookings/unknown123', me.cookie)).status).toBe(404)
  const own = await get(`/bookings/${mineLater.id}`, me.cookie)
  expect((await own.json()).booking).toMatchObject({ id: mineLater.id, originalDeadline: mineLater.originalDeadline.toISOString() })
  expect((await get('/bookings')).status).toBe(401)
  expect((await get('/bookings?view=everything', me.cookie)).status).toBe(400)
})

test('at the exact deadline an unpaid booking is expired and frees its places, before the worker runs', async () => {
  const customer = await registerCustomer(server.baseUrl, phone())
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 48 * HOUR) })
  const deadline = new Date(Date.now() + HOUR)
  const booking = await book(customer.customerId, session.id, ['A', 'B'], deadline)
  const justBefore = new Date(deadline.getTime() - 1)

  expect((await getMyBooking(db.prisma, customer.customerId, booking.id, justBefore)).booking.status).toBe('awaiting_payment')
  expect((await getOccupiedPlaceCounts(db.prisma, [session.id], justBefore)).get(session.id)).toBe(2)

  const atDeadline = await getMyBooking(db.prisma, customer.customerId, booking.id, deadline)
  expect(atDeadline.booking).toMatchObject({ status: 'expired', originalDeadline: deadline.toISOString() })
  expect((await getOccupiedPlaceCounts(db.prisma, [session.id], deadline)).get(session.id)).toBe(0)
  expect((await listMyBookings(db.prisma, customer.customerId, { view: 'upcoming', cursor: null, limit: 20 }, deadline)).items).toEqual([])
  const history = await listMyBookings(db.prisma, customer.customerId, { view: 'history', cursor: null, limit: 20 }, deadline)
  expect(history.items.map(item => [item.id, item.status])).toEqual([[booking.id, 'expired']])
  expect((await db.prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe('awaiting_payment')
})

test('the worker writes expiry once, keeps the original deadline, and leaves other states alone', async () => {
  const customer = await registerCustomer(server.baseUrl, phone())
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 48 * HOUR) })
  const now = new Date()
  const due = await book(customer.customerId, session.id, ['Due'], new Date(now.getTime() - 1000))
  const notYet = await book(customer.customerId, session.id, ['Later'], new Date(now.getTime() + HOUR))
  const confirmed = await book(customer.customerId, session.id, ['Paid'], new Date(now.getTime() - 1000))
  await db.prisma.booking.update({ where: { id: confirmed.id }, data: { status: 'confirmed' } })

  expect(await expireDueBookings(db.prisma, now, 1)).toBeGreaterThanOrEqual(1)
  expect(await expireDueBookings(db.prisma, now)).toBe(0)
  const rows = await db.prisma.booking.findMany({ where: { id: { in: [due.id, notYet.id, confirmed.id] } } })
  const byId = Object.fromEntries(rows.map(row => [row.id, row]))
  expect(byId[due.id]).toMatchObject({ status: 'expired', originalDeadline: due.originalDeadline })
  expect(byId[notYet.id].status).toBe('awaiting_payment')
  expect(byId[confirmed.id].status).toBe('confirmed')
})

test('history pages by booking time with an opaque cursor', async () => {
  const customer = await registerCustomer(server.baseUrl, phone())
  const past = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 48 * HOUR) })
  const base = Date.now() - 10 * HOUR
  const ids = []
  for (let index = 0; index < 5; index++) ids.push((await book(customer.customerId, past.id, ['P' + index], new Date(base), new Date(base + index * 60_000))).id)
  const first = await (await get('/bookings?view=history&limit=2', customer.cookie)).json() as CustomerBookingListResponse
  expect(first.items.map(item => item.id)).toEqual([ids[4], ids[3]])
  const second = await (await get(`/bookings?view=history&limit=2&cursor=${first.nextCursor}`, customer.cookie)).json() as CustomerBookingListResponse
  const third = await (await get(`/bookings?view=history&limit=2&cursor=${second.nextCursor}`, customer.cookie)).json() as CustomerBookingListResponse
  expect([...second.items, ...third.items].map(item => item.id)).toEqual([ids[2], ids[1], ids[0]])
  expect(third.nextCursor).toBeNull()
  expect((await get('/bookings?view=history&cursor=not-a-cursor', customer.cookie)).status).toBe(400)
})

test('a booking carries the reason on its latest rejected proof, and none before any rejection', async () => {
  const customer = await registerCustomer(server.baseUrl, phone())
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 48 * HOUR) })
  const booking = await book(customer.customerId, session.id, ['A'], new Date(Date.now() + HOUR))
  expect((await getMyBooking(db.prisma, customer.customerId, booking.id)).rejection).toBeNull()

  const reviewed = (minutes: number, reason: string, note: string | null) => db.prisma.paymentProof.create({ data: {
    bookingId: booking.id, customerId: customer.customerId, submissionId: crypto.randomUUID(), status: 'rejected',
    reviewedAt: new Date(Date.now() - minutes * 60_000), rejectionReason: reason, rejectionNote: note,
  } })
  await reviewed(30, 'unreadable', null)
  await reviewed(5, 'amount_mismatch', 'Kurang Rp 20.000.')
  expect((await getMyBooking(db.prisma, customer.customerId, booking.id)).rejection).toEqual({ reason: 'amount_mismatch', note: 'Kurang Rp 20.000.' })
})
