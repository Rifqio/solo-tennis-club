import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { getOccupiedPlaceCounts } from '../../server/features/capacity/occupancy.ts'
import { submitProof } from '../../server/features/payments/customer-payment.service.ts'
import type { AdminBookingDetailResponse, AdminRecordPaymentResponse } from '../../shared/api/admin-bookings.ts'
import { clubToday } from '../../shared/club-time.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { registerCustomer } from '../support/customer-fixtures.ts'
import { adminFetch, provisionTestAdmin, signInAs } from '../support/admin-fixtures.ts'

const HOUR = 60 * 60 * 1000
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
let admin: Awaited<ReturnType<typeof signInAs>>
const privateDir = mkdtempSync(resolve(tmpdir(), 'stc-private-'))
let phoneIndex = 9500
const phone = () => '+628123461' + String(phoneIndex++)

beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development', privateDir }))
  admin = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma, { displayName: 'Admin Kasir' }))
})
afterAll(async () => { await server?.close(); await db?.cleanup(); rmSync(privateDir, { recursive: true, force: true }) })

async function bookingIn(status: string, deadlineIn: number, places = 2, sessionId?: string, customerId: string | null = null) {
  const session = sessionId ? { id: sessionId } : await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 72 * HOUR) })
  const booking = await db.prisma.booking.create({ data: {
    sessionId: session.id, customerId, actorId: customerId ?? 'admin', actorKind: customerId ? 'customer' : 'admin', createRequestId: crypto.randomUUID(), fingerprint: 'test', status,
    bookerName: 'Budi', bookerPhone: '+6281200000000', quantity: places, unitPriceIdr: 100000, totalPriceIdr: 100000 * places,
    originalDeadline: new Date(Date.now() + deadlineIn), participants: { create: Array.from({ length: places }, (_, index) => ({ position: index + 1, name: `P${index + 1}` })) },
  } })
  return { sessionId: session.id, booking }
}

const versionOf = async (id: string) => ((await (await adminFetch(server.baseUrl, admin, `/bookings/${id}`)).json()) as AdminBookingDetailResponse).booking.version
const record = (id: string, body: object) => adminFetch(server.baseUrl, admin, `/bookings/${id}/payments`, { method: 'POST', body: JSON.stringify(body) })
const payment = async (id: string, extra: object = {}) => ({ version: await versionOf(id), requestId: crypto.randomUUID(), method: 'cash', amountIdr: 200000, paidOn: clubToday(), ...extra })

test('recording a cash payment confirms an unpaid booking and lists the payment with who recorded it', async () => {
  const { booking } = await bookingIn('awaiting_payment', 2 * HOUR)
  const response = await record(booking.id, await payment(booking.id, { note: 'Bayar di lapangan' }))
  expect(response.status).toBe(201)
  const body = await response.json() as AdminRecordPaymentResponse
  expect(body.booking).toMatchObject({ status: 'confirmed', confirmed: { by: 'Admin Kasir' }, paymentNote: 'Bayar di lapangan' })
  expect(body.booking.payments[0]).toMatchObject({ method: 'cash', amountIdr: 200000, paidOn: clubToday(), recorded: { by: 'Admin Kasir' } })
})

test('a payment recorded while a proof waits for review confirms the booking and settles the proof', async () => {
  const member = await registerCustomer(server.baseUrl, phone())
  const { booking } = await bookingIn('awaiting_payment', 2 * HOUR, 1, undefined, member.customerId)
  await submitProof(db.prisma, privateDir, member.customerId, booking.id, { submissionId: crypto.randomUUID(), files: [{ bytes: JPEG, name: 'a.jpg' }] })
  const body = await (await record(booking.id, await payment(booking.id, { method: 'transfer', amountIdr: 100000 }))).json() as AdminRecordPaymentResponse
  expect(body.booking.status).toBe('confirmed')
  expect(body.booking.proofs[0]).toMatchObject({ status: 'approved' })
})

test('the same request recorded twice is kept once; a different payment under the same id is refused', async () => {
  const { booking } = await bookingIn('awaiting_payment', 2 * HOUR)
  const body = await payment(booking.id)
  expect((await record(booking.id, body)).status).toBe(201)
  const again = await record(booking.id, body)
  expect(again.status).toBe(200)
  expect((await again.json() as AdminRecordPaymentResponse).replayed).toBe(true)
  expect(await db.prisma.paymentRecord.count({ where: { bookingId: booking.id } })).toBe(1)
  expect((await (await record(booking.id, { ...body, amountIdr: 1 })).json()).error.code).toBe('IDEMPOTENCY_CONFLICT')
})

test('a booking past its deadline is revived only while its places are still free', async () => {
  const { sessionId, booking } = await bookingIn('expired', -HOUR, 2)
  const revived = await (await record(booking.id, await payment(booking.id))).json() as AdminRecordPaymentResponse
  expect(revived.booking.status).toBe('confirmed')
  expect((await getOccupiedPlaceCounts(db.prisma, [sessionId])).get(sessionId)).toBe(2)

  // Fill the session (8 places in the sample catalog's default), then a lapsed booking cannot come back.
  const full = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 72 * HOUR) })
  const max = (await db.prisma.classSession.findUniqueOrThrow({ where: { id: full.id } })).maxParticipants
  await bookingIn('confirmed', HOUR, max, full.id)
  const { booking: lapsed } = await bookingIn('awaiting_payment', -HOUR, 1, full.id)
  expect((await (await record(lapsed.id, await payment(lapsed.id))).json()).error.code).toBe('CAPACITY_UNAVAILABLE')
  expect((await db.prisma.booking.findUniqueOrThrow({ where: { id: lapsed.id } })).status).toBe('awaiting_payment')
})

test('paid bookings, cancelled sessions, stale versions and future dates are refused', async () => {
  const { booking: paid } = await bookingIn('confirmed', HOUR)
  expect((await (await record(paid.id, await payment(paid.id))).json()).error.code).toBe('BOOKING_NOT_PAYABLE')

  const { sessionId, booking: cancelled } = await bookingIn('awaiting_payment', HOUR)
  await db.prisma.classSession.update({ where: { id: sessionId }, data: { status: 'cancelled' } })
  expect((await (await record(cancelled.id, await payment(cancelled.id))).json()).error.code).toBe('BOOKING_NOT_PAYABLE')

  const { booking } = await bookingIn('awaiting_payment', HOUR)
  const stale = await record(booking.id, { ...(await payment(booking.id)), version: 1 + await versionOf(booking.id) })
  expect((await stale.json()).error).toMatchObject({ code: 'STALE_VERSION', latest: { booking: { id: booking.id } } })
  const future = await record(booking.id, await payment(booking.id, { paidOn: '2099-01-01' }))
  expect((await future.json()).error).toMatchObject({ code: 'VALIDATION_FAILED', fields: { paidOn: 'DATE_TOO_FAR' } })
  expect((await record(booking.id, await payment(booking.id, { method: 'cheque' }))).status).toBe(400)
})
