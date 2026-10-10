import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { createPrismaClient, initializeDatabase } from '../../server/db.ts'
import type { PrismaClient } from '../../server/generated/prisma/client.ts'
import { createAdmissionService } from '../../server/features/booking-admission/admission.service.ts'
import { DatabaseBusyError } from '../../server/database/transaction.ts'
import { ApiError } from '../../server/http/errors.ts'
import { getOccupiedPlaceCounts } from '../../server/features/capacity/occupancy.ts'
import type { AdmittedBookingResponse } from '../../shared/api/booking-admission.ts'
import type { AdminBookingDetailResponse, AdminBookingOptionsResponse, VerifiedCustomerLookupResponse } from '../../shared/api/admin-bookings.ts'
import type { ApiErrorBody } from '../../shared/api/errors.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { adminFetch, provisionTestAdmin, signInAs } from '../support/admin-fixtures.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { registerCustomer } from '../support/customer-fixtures.ts'

const HOUR = 60 * 60 * 1000
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let admin: Awaited<ReturnType<typeof signInAs>>
let adminId: string
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
let phoneIndex = 100
const phone = () => '+62812346' + String(phoneIndex++).padStart(4, '0')

beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' }))
  const credentials = await provisionTestAdmin(db.prisma)
  admin = await signInAs(server.baseUrl, credentials)
  adminId = (await db.prisma.adminAccount.findUniqueOrThrow({ where: { email: credentials.email } })).id
})
afterAll(async () => { await server?.close(); await db?.cleanup() })

const session = (overrides: { maxParticipants?: number; startsAt?: Date; priceIdr?: number } = {}) =>
  createSampleSession(db.prisma, { catalog, startsAt: overrides.startsAt ?? new Date(Date.now() + 48 * HOUR), maxParticipants: overrides.maxParticipants ?? 8, priceIdr: overrides.priceIdr })

function customerPost(customer: { cookie: string; csrfToken: string }, body: unknown) {
  return fetch(server.baseUrl + '/api/customer/bookings', {
    method: 'POST',
    headers: { Origin: server.baseUrl, 'Content-Type': 'application/json', Cookie: customer.cookie, 'X-CSRF-Token': customer.csrfToken },
    body: JSON.stringify(body),
  })
}
const customerGet = (customer: { cookie: string }, path: string) =>
  fetch(server.baseUrl + '/api/customer' + path, { headers: { Origin: server.baseUrl, Accept: 'application/json', Cookie: customer.cookie } })

function adminBody(sessionId: string, names: string[], extra: Record<string, unknown> = {}) {
  return { sessionId, quantity: names.length, participantNames: names, expectedSessionVersion: 1, createRequestId: randomUUID(), bookerName: 'Rina WA', bookerPhone: '0812 3460 9999', ...extra }
}
const adminPost = (body: unknown) => adminFetch(server.baseUrl, admin, '/bookings', { method: 'POST', body: JSON.stringify(body) })
const errorCode = async (response: Response) => (await response.json() as ApiErrorBody).error.code

test('admin booking: same quote and admission as customers, unowned with a normalized contact, replay-safe', async () => {
  const target = await session({ maxParticipants: 4, priceIdr: 120000 })
  const options = await (await adminFetch(server.baseUrl, admin, `/booking-options/${target.id}`)).json() as AdminBookingOptionsResponse
  expect(options).toMatchObject({ sessionVersion: 1, unitPriceIdr: 120000, remainingPlaces: 4, canReserve: true, session: { id: target.id, cancelled: false } })

  const body = adminBody(target.id, ['Rina', ' Budi  Santoso '], { bookerPhone: '0812-3460-0001' })
  const first = await adminPost(body)
  expect(first.status).toBe(201)
  const created = await first.json() as AdmittedBookingResponse
  expect(created.booking).toMatchObject({ quantity: 2, unitPriceIdr: 120000, totalPriceIdr: 240000, status: 'awaiting_payment' })
  expect(created.booking.participants.map(row => row.name)).toEqual(['Rina', 'Budi Santoso'])
  expect(Date.parse(created.booking.originalDeadline) - Date.parse(created.booking.createdAt)).toBeGreaterThanOrEqual(5 * HOUR - 1000)

  const stored = await db.prisma.booking.findUniqueOrThrow({ where: { id: created.booking.id } })
  expect(stored).toMatchObject({ customerId: null, actorKind: 'admin', actorId: adminId, bookerName: 'Rina WA', bookerPhone: '+6281234600001' })

  const replay = await adminPost(body)
  expect(replay.status).toBe(200)
  expect(await replay.json()).toMatchObject({ replayed: true, booking: { id: created.booking.id } })
  expect(await errorCode(await adminPost({ ...body, bookerName: 'Someone else' }))).toBe('IDEMPOTENCY_CONFLICT')
  expect(await errorCode(await adminPost(adminBody(target.id, ['A', 'B', 'C'])))).toBe('CAPACITY_UNAVAILABLE')
  expect(await errorCode(await adminPost(adminBody(target.id, ['A'], { expectedSessionVersion: 7 })))).toBe('SESSION_CHANGED')
  expect((await getOccupiedPlaceCounts(db.prisma, [target.id])).get(target.id)).toBe(2)
})

test('admin booking validates the contact and keeps the five-hour cutoff', async () => {
  const target = await session()
  const missing = await adminPost(adminBody(target.id, ['A'], { bookerName: '  ', bookerPhone: '' }))
  expect(missing.status).toBe(400)
  expect((await missing.json() as ApiErrorBody).error.fields).toEqual({ bookerName: 'REQUIRED', bookerPhone: 'REQUIRED' })
  const badPhone = await adminPost(adminBody(target.id, ['A'], { bookerPhone: '12' }))
  expect((await badPhone.json() as ApiErrorBody).error.fields).toEqual({ bookerPhone: 'INVALID_FORMAT' })
  expect(await errorCode(await adminPost(adminBody(target.id, ['A', ''])))).toBe('VALIDATION_FAILED')

  const soon = await session({ startsAt: new Date(Date.now() + 5 * HOUR - 60_000) })
  expect(await errorCode(await adminPost(adminBody(soon.id, ['A'])))).toBe('BOOKING_CLOSED')
  expect((await adminFetch(server.baseUrl, admin, `/booking-options/${soon.id}`).then(response => response.json()) as AdminBookingOptionsResponse).canReserve).toBe(false)
})

test('admin booking endpoints need an admin, CSRF and an unknown session is 404', async () => {
  const target = await session()
  expect((await fetch(server.baseUrl + '/api/admin/bookings', { method: 'POST', headers: { Origin: server.baseUrl, 'Content-Type': 'application/json' }, body: JSON.stringify(adminBody(target.id, ['A'])) })).status).toBe(401)
  expect((await adminFetch(server.baseUrl, { ...admin, csrfToken: 'wrong' }, '/bookings', { method: 'POST', body: JSON.stringify(adminBody(target.id, ['A'])) })).status).toBe(403)
  expect((await adminFetch(server.baseUrl, admin, '/booking-options/unknown123')).status).toBe(404)
  expect(await errorCode(await adminPost(adminBody('unknown123', ['A'])))).toBe('NOT_FOUND')
  expect((await fetch(server.baseUrl + '/api/admin/verified-customers?phone=081234567890')).status).toBe(401)
})

test('customer and admin admissions racing over HTTP never exceed capacity', async () => {
  const customers = await Promise.all([0, 1, 2].map(index => registerCustomer(server.baseUrl, phone(), `Racer ${index}`)))
  for (let round = 0; round < 4; round++) {
    const target = await session({ maxParticipants: 5 })
    const requests = [
      ...customers.map(customer => customerPost(customer, { sessionId: target.id, quantity: 2, participantNames: ['One', 'Two'], expectedSessionVersion: 1, createRequestId: randomUUID() })),
      adminPost(adminBody(target.id, ['Desk one', 'Desk two'])),
      adminPost(adminBody(target.id, ['Walk-in'])),
    ]
    const statuses = (await Promise.all(requests)).map(response => response.status)
    expect(statuses.every(status => status === 201 || status === 409)).toBe(true)
    const occupied = (await getOccupiedPlaceCounts(db.prisma, [target.id])).get(target.id)!
    expect(occupied).toBeLessThanOrEqual(5)
    // Five places, groups of 2, 2, 2, 2 and 1: whatever wins, at least four places are taken and no group is split.
    expect(occupied).toBeGreaterThanOrEqual(4)
    const rows = await db.prisma.booking.findMany({ where: { sessionId: target.id }, include: { participants: true } })
    expect(rows.every(row => row.participants.length === row.quantity)).toBe(true)
  }
})

test('independent connections admitting at once still respect one capacity', async () => {
  const second: PrismaClient = createPrismaClient(db.databaseFile)
  await initializeDatabase(second)
  try {
    const target = await session({ maxParticipants: 6 })
    const customer = await registerCustomer(server.baseUrl, phone(), 'Connection customer')
    const services = [createAdmissionService(db.prisma), createAdmissionService(second)]
    const attempts = Array.from({ length: 10 }, (_, index) => services[index % 2]!.admit({
      actor: index % 2 ? { kind: 'admin', id: adminId } : { kind: 'customer', id: customer.customerId },
      customerId: index % 2 ? null : customer.customerId,
      booker: { name: 'Racer', phone: '+6281234699999' },
      input: { sessionId: target.id, quantity: 2, participantNames: ['A', 'B'], expectedSessionVersion: 1, createRequestId: randomUUID() },
    }))
    const results = await Promise.allSettled(attempts)
    // A refusal is either "no room" or a lock that stayed busy through every retry; neither reserves anything.
    const refusals = results.flatMap(result => result.status === 'rejected' ? [result.reason as Error] : [])
    expect(refusals.every(reason => reason instanceof DatabaseBusyError || (reason instanceof ApiError && reason.code === 'CAPACITY_UNAVAILABLE'))).toBe(true)
    const admitted = results.length - refusals.length
    const busy = refusals.filter(reason => reason instanceof DatabaseBusyError).length
    expect(admitted).toBeLessThanOrEqual(3)
    if (!busy) expect(admitted).toBe(3)
    expect((await getOccupiedPlaceCounts(db.prisma, [target.id])).get(target.id)).toBe(admitted * 2)
  } finally {
    await second.$disconnect()
  }
})

test('a refused admission rolls back its capacity lock write and saves nothing', async () => {
  const target = await session({ maxParticipants: 1 })
  const before = await db.prisma.classSession.findUniqueOrThrow({ where: { id: target.id } })
  expect(await errorCode(await adminPost(adminBody(target.id, ['A', 'B'])))).toBe('CAPACITY_UNAVAILABLE')
  const after = await db.prisma.classSession.findUniqueOrThrow({ where: { id: target.id } })
  expect(after.capacityRevision).toBe(before.capacityRevision)
  expect(await db.prisma.booking.count({ where: { sessionId: target.id } })).toBe(0)
})

test('linking: exact verified phone, version-checked, ownership only, audited, then the customer sees it', async () => {
  const target = await session()
  const contact = phone()
  const created = await (await adminPost(adminBody(target.id, ['Rina', 'Dita'], { bookerPhone: contact }))).json() as AdmittedBookingResponse
  const bookingId = created.booking.id
  const before = await db.prisma.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { participants: { orderBy: { position: 'asc' } } } })

  // Nobody has signed up with this number yet.
  const empty = await (await adminFetch(server.baseUrl, admin, `/verified-customers?phone=${encodeURIComponent(contact)}`)).json() as VerifiedCustomerLookupResponse
  expect(empty.customer).toBeNull()
  expect((await adminFetch(server.baseUrl, admin, '/verified-customers?phone=abc')).status).toBe(400)

  const owner = await registerCustomer(server.baseUrl, contact, 'Rina Verified')
  const stranger = await registerCustomer(server.baseUrl, phone(), 'Someone Else')
  // Same number, but no automatic matching: the customer cannot see or claim the booking yet.
  expect((await customerGet(owner, `/bookings/${bookingId}`)).status).toBe(404)

  const found = await (await adminFetch(server.baseUrl, admin, `/verified-customers?phone=${encodeURIComponent(contact.replace('+62', '0'))}`)).json() as VerifiedCustomerLookupResponse
  expect(found.customer).toMatchObject({ id: owner.customerId, displayName: 'Rina Verified', phone: contact })

  const link = (customerId: string, version: number, session = admin) =>
    adminFetch(server.baseUrl, session, `/bookings/${bookingId}/customer-link`, { method: 'PUT', body: JSON.stringify({ customerId, version }) })
  expect((await link(owner.customerId, 1, { ...admin, csrfToken: 'wrong' })).status).toBe(403)
  expect(await errorCode(await link(stranger.customerId, 1))).toBe('CUSTOMER_MISMATCH')
  const stale = await link(owner.customerId, 9)
  expect(stale.status).toBe(409)
  expect(await stale.json()).toMatchObject({ error: { code: 'STALE_VERSION', latest: { booking: { version: 1 } } } })
  expect((await link('unknown123', 1)).status).toBe(404)

  const linkedResponse = await link(owner.customerId, 1)
  expect(linkedResponse.status).toBe(200)
  const linked = await linkedResponse.json() as AdminBookingDetailResponse
  expect(linked.booking).toMatchObject({ version: 2, customer: { displayName: 'Rina Verified', phone: contact }, linked: { by: 'Test administrator' } })

  const after = await db.prisma.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { participants: { orderBy: { position: 'asc' } } } })
  expect(after).toMatchObject({ customerId: owner.customerId, version: 2, quantity: before.quantity, unitPriceIdr: before.unitPriceIdr, totalPriceIdr: before.totalPriceIdr, bookerName: before.bookerName, bookerPhone: before.bookerPhone, status: before.status })
  expect(after.originalDeadline.getTime()).toBe(before.originalDeadline.getTime())
  expect(after.participants.map(row => row.name)).toEqual(before.participants.map(row => row.name))
  const events = await db.prisma.bookingOwnershipEvent.findMany({ where: { bookingId } })
  expect(events).toEqual([expect.objectContaining({ adminId: adminId, previousCustomerId: null, customerId: owner.customerId, bookingVersion: 2 })])

  // A retry of the same link is fine; anything else cannot move an owned booking.
  expect((await link(owner.customerId, 1)).status).toBe(200)
  expect(await errorCode(await link(stranger.customerId, 2))).toBe('BOOKING_ALREADY_LINKED')
  expect(await db.prisma.bookingOwnershipEvent.count({ where: { bookingId } })).toBe(1)

  const mine = await customerGet(owner, `/bookings/${bookingId}`)
  expect(mine.status).toBe(200)
  expect((await customerGet(stranger, `/bookings/${bookingId}`)).status).toBe(404)
})

test('a customer-made booking already has its owner and cannot be relinked', async () => {
  const target = await session()
  const customer = await registerCustomer(server.baseUrl, phone(), 'App Booker')
  const other = await registerCustomer(server.baseUrl, phone(), 'Other Booker')
  const response = await customerPost(customer, { sessionId: target.id, quantity: 1, participantNames: ['App Booker'], expectedSessionVersion: 1, createRequestId: randomUUID() })
  expect(response.status).toBe(201)
  const { booking } = await response.json() as AdmittedBookingResponse
  const result = await adminFetch(server.baseUrl, admin, `/bookings/${booking.id}/customer-link`, { method: 'PUT', body: JSON.stringify({ customerId: other.customerId, version: 1 }) })
  expect(await errorCode(result)).toBe('BOOKING_ALREADY_LINKED')
  const detail = await (await adminFetch(server.baseUrl, admin, `/bookings/${booking.id}`)).json() as AdminBookingDetailResponse
  expect(detail.booking).toMatchObject({ source: 'customer', linked: null, customer: { displayName: 'App Booker' } })
})
