import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { getOccupiedPlaceCounts } from '../../server/features/capacity/occupancy.ts'
import { submitProof } from '../../server/features/payments/customer-payment.service.ts'
import type { AdminBookingDetailResponse, AdminBookingListResponse, AdminProofReviewResponse } from '../../shared/api/admin-bookings.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { registerCustomer } from '../support/customer-fixtures.ts'
import { adminFetch, provisionTestAdmin, signInAs } from '../support/admin-fixtures.ts'
import { createDiskStore } from '../../server/storage/file-store.ts'

const HOUR = 60 * 60 * 1000
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
let admin: Awaited<ReturnType<typeof signInAs>>
const privateDir = mkdtempSync(resolve(tmpdir(), 'stc-private-'))
let phoneIndex = 9000
const phone = () => '+628123460' + String(phoneIndex++)

beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development', privateDir }))
  admin = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma, { displayName: 'Admin Satu' }))
})
afterAll(async () => { await server?.close(); await db?.cleanup(); rmSync(privateDir, { recursive: true, force: true }) })

// A member's booking with a proof sent `deadlineIn` before its deadline (negative: the deadline has since passed).
async function bookingWithProof(deadlineIn = 2 * HOUR, places = 2) {
  const member = await registerCustomer(server.baseUrl, phone(), 'Andy')
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 72 * HOUR) })
  const deadline = new Date(Date.now() + deadlineIn)
  const booking = await db.prisma.booking.create({ data: {
    sessionId: session.id, customerId: member.customerId, actorId: member.customerId, createRequestId: crypto.randomUUID(), fingerprint: 'test',
    bookerName: 'Andy', bookerPhone: '+6281200000000', quantity: places, unitPriceIdr: 100000, totalPriceIdr: 100000 * places,
    originalDeadline: deadline, participants: { create: Array.from({ length: places }, (_, index) => ({ position: index + 1, name: `P${index + 1}` })) },
  } })
  // Sent while the deadline was still ahead.
  const sent = await submitProof(db.prisma, createDiskStore(privateDir), member.customerId, booking.id, { submissionId: crypto.randomUUID(), files: [{ bytes: JPEG, name: 'bukti.jpg' }] },
    () => new Date(deadline.getTime() - 60_000))
  return { member, session, booking, proofId: sent.proof.id }
}

const detailOf = async (id: string) => (await (await adminFetch(server.baseUrl, admin, `/bookings/${id}`)).json()) as AdminBookingDetailResponse
const review = (bookingId: string, proofId: string, action: 'approve' | 'reject', body: object) =>
  adminFetch(server.baseUrl, admin, `/bookings/${bookingId}/proofs/${proofId}/${action}`, { method: 'POST', body: JSON.stringify(body) })

test('Perlu dicek lists proofs waiting for an admin, oldest first, with their count', async () => {
  const first = await bookingWithProof()
  const second = await bookingWithProof()
  const list = await (await adminFetch(server.baseUrl, admin, '/bookings?status=review')).json() as AdminBookingListResponse
  const ids = list.items.map(item => item.id)
  expect(ids.indexOf(first.booking.id)).toBeLessThan(ids.indexOf(second.booking.id))
  expect(list.items.every(item => item.status === 'awaiting_verification')).toBe(true)
  expect(list.reviewCount).toBeGreaterThanOrEqual(2)

  const detail = await detailOf(first.booking.id)
  expect(detail.booking.proofs[0]).toMatchObject({ id: first.proofId, status: 'pending', reviewed: null, files: [{ originalName: 'bukti.jpg', contentType: 'image/jpeg' }] })
})

test('approving confirms the booking, records who and when, and keeps its places', async () => {
  const { session, booking, proofId } = await bookingWithProof()
  const { booking: before } = await detailOf(booking.id)
  const response = await review(booking.id, proofId, 'approve', { version: before.version })
  expect(response.status).toBe(200)
  const body = await response.json() as AdminProofReviewResponse
  expect(body.outcome).toBe('confirmed')
  expect(body.booking).toMatchObject({ status: 'confirmed', confirmed: { by: 'Admin Satu' }, proofs: [{ status: 'approved', reviewed: { by: 'Admin Satu' } }] })
  expect((await getOccupiedPlaceCounts(db.prisma, [session.id], new Date(Date.now() + 10 * HOUR))).get(session.id)).toBe(2)
  // A second review of the same proof finds it already settled.
  expect((await review(booking.id, proofId, 'approve', { version: before.version })).status).toBe(409)
})

test('rejecting before the deadline asks for a new proof within the same deadline', async () => {
  const { member, booking, proofId } = await bookingWithProof()
  const { booking: before } = await detailOf(booking.id)
  const body = await (await review(booking.id, proofId, 'reject', { version: before.version, reason: 'amount_mismatch' })).json() as AdminProofReviewResponse
  expect(body.outcome).toBe('needs_correction')
  expect(body.booking.proofs[0]).toMatchObject({ status: 'rejected', rejectionReason: 'amount_mismatch' })
  const stored = await db.prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })
  expect(stored).toMatchObject({ status: 'needs_correction', originalDeadline: booking.originalDeadline })
  // The member can send again before the deadline.
  const again = await submitProof(db.prisma, createDiskStore(privateDir), member.customerId, booking.id, { submissionId: crypto.randomUUID(), files: [{ bytes: JPEG, name: 'baru.jpg' }] })
  expect(again.booking.status).toBe('awaiting_verification')
})

test('rejecting after the deadline releases the places and offers no correction', async () => {
  const { member, session, booking, proofId } = await bookingWithProof(-HOUR)
  expect((await getOccupiedPlaceCounts(db.prisma, [session.id])).get(session.id)).toBe(2)
  const { booking: before } = await detailOf(booking.id)
  const body = await (await review(booking.id, proofId, 'reject', { version: before.version, reason: 'not_received' })).json() as AdminProofReviewResponse
  expect(body.outcome).toBe('expired')
  expect(body.booking.status).toBe('expired')
  expect((await getOccupiedPlaceCounts(db.prisma, [session.id])).get(session.id)).toBe(0)
  await expect(submitProof(db.prisma, createDiskStore(privateDir), member.customerId, booking.id, { submissionId: crypto.randomUUID(), files: [{ bytes: JPEG, name: 'x.jpg' }] }))
    .rejects.toMatchObject({ code: 'PAYMENT_DEADLINE_PASSED' })
})

test('a review at an old version answers with the latest booking; a cancelled session is never confirmed', async () => {
  const { booking, proofId } = await bookingWithProof()
  const { booking: before } = await detailOf(booking.id)
  const stale = await review(booking.id, proofId, 'approve', { version: before.version - 1 })
  expect(stale.status).toBe(409)
  expect((await stale.json()).error).toMatchObject({ code: 'STALE_VERSION', latest: { booking: { id: booking.id, version: before.version } } })

  const cancelled = await bookingWithProof()
  await db.prisma.classSession.update({ where: { id: cancelled.session.id }, data: { status: 'cancelled' } })
  const { booking: current } = await detailOf(cancelled.booking.id)
  expect((await (await review(cancelled.booking.id, cancelled.proofId, 'approve', { version: current.version })).json()).error.code).toBe('BOOKING_NOT_PAYABLE')
})

test('a rejection needs a known reason, and "other" needs a note; members cannot review', async () => {
  const { member, booking, proofId } = await bookingWithProof()
  const { booking: before } = await detailOf(booking.id)
  expect((await (await review(booking.id, proofId, 'reject', { version: before.version, reason: 'other' })).json()).error).toMatchObject({ fields: { note: 'REQUIRED' } })
  expect((await review(booking.id, proofId, 'reject', { version: before.version, reason: 'vibes' })).status).toBe(400)
  const asMember = await fetch(server.baseUrl + `/api/admin/bookings/${booking.id}/proofs/${proofId}/approve`, {
    method: 'POST', headers: { Origin: server.baseUrl, 'Content-Type': 'application/json', Cookie: member.cookie }, body: JSON.stringify({ version: before.version }),
  })
  expect(asMember.status).toBe(401)
  const ok = await (await review(booking.id, proofId, 'reject', { version: before.version, reason: 'other', note: 'Nama pengirim beda' })).json() as AdminProofReviewResponse
  expect(ok.booking.proofs[0]).toMatchObject({ rejectionReason: 'other', rejectionNote: 'Nama pengirim beda' })
})
