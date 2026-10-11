import { mkdtempSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { getOccupiedPlaceCounts } from '../../server/features/capacity/occupancy.ts'
import { submitProof } from '../../server/features/payments/customer-payment.service.ts'
import type { CustomerPaymentResponse, ProofSubmissionResponse } from '../../shared/api/customer-payments.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { registerCustomer } from '../support/customer-fixtures.ts'

const HOUR = 60 * 60 * 1000
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
const PDF = Buffer.from('%PDF-1.4\n%test\n')
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
const privateDir = mkdtempSync(resolve(tmpdir(), 'stc-private-'))
let phoneIndex = 8000
const phone = () => '+628123459' + String(phoneIndex++)

beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development', privateDir }))
})
afterAll(async () => { await server?.close(); await db?.cleanup(); rmSync(privateDir, { recursive: true, force: true }) })

async function bookFor(customerId: string, status = 'awaiting_payment', deadline = new Date(Date.now() + 2 * HOUR), places = 2) {
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 72 * HOUR) })
  const booking = await db.prisma.booking.create({ data: {
    sessionId: session.id, customerId, actorId: customerId, createRequestId: crypto.randomUUID(), fingerprint: 'test', status,
    bookerName: 'Andy', bookerPhone: '+6281200000000', quantity: places, unitPriceIdr: 100000, totalPriceIdr: 100000 * places,
    originalDeadline: deadline, participants: { create: Array.from({ length: places }, (_, index) => ({ position: index + 1, name: `P${index + 1}` })) },
  } })
  return { session, booking }
}

function send(path: string, member: { cookie: string; csrfToken: string }, files: { bytes: Buffer; name: string; type?: string }[], submissionId: string = crypto.randomUUID(), headers: Record<string, string> = {}) {
  const form = new FormData()
  form.set('submissionId', submissionId)
  for (const file of files) form.append('files', new Blob([new Uint8Array(file.bytes)], { type: file.type ?? 'image/jpeg' }), file.name)
  return fetch(server.baseUrl + '/api/customer' + path, {
    method: 'POST', body: form,
    headers: { Origin: server.baseUrl, Cookie: member.cookie, 'X-CSRF-Token': member.csrfToken, ...headers },
  })
}
const get = (path: string, cookie: string) => fetch(server.baseUrl + '/api/customer' + path, { headers: { Origin: server.baseUrl, Cookie: cookie } })
const filesOf = (bookingId: string) => existsSync(resolve(privateDir, 'proofs', bookingId)) ? readdirSync(resolve(privateDir, 'proofs', bookingId)) : []

test('a member sees what to pay, sends proof, and the booking waits for review with its places held past the deadline', async () => {
  const member = await registerCustomer(server.baseUrl, phone(), 'Andy')
  const { session, booking } = await bookFor(member.customerId)

  const before = await (await get(`/bookings/${booking.id}/payment`, member.cookie)).json() as CustomerPaymentResponse
  expect(before).toMatchObject({ canSubmit: true, latestProof: null, booking: { id: booking.id, totalPriceIdr: 200000, status: 'awaiting_payment' } })

  const response = await send(`/bookings/${booking.id}/proofs`, member, [{ bytes: JPEG, name: 'bukti bayar.jpg' }, { bytes: PDF, name: '../../transfer.pdf', type: 'application/pdf' }])
  expect(response.status).toBe(201)
  const body = await response.json() as ProofSubmissionResponse
  expect(body.booking.status).toBe('awaiting_verification')
  expect(body.proof).toMatchObject({ status: 'pending', files: [{ originalName: 'bukti bayar.jpg', contentType: 'image/jpeg' }, { originalName: 'transfer.pdf', contentType: 'application/pdf' }] })
  expect(filesOf(booking.id)).toHaveLength(2)

  // Past the original deadline the proof still holds the places, and the deadline itself never moved.
  const stored = await db.prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })
  expect(stored.originalDeadline).toEqual(booking.originalDeadline)
  expect((await getOccupiedPlaceCounts(db.prisma, [session.id], new Date(Date.now() + 5 * HOUR))).get(session.id)).toBe(2)

  const after = await (await get(`/bookings/${booking.id}/payment`, member.cookie)).json() as CustomerPaymentResponse
  expect(after).toMatchObject({ canSubmit: false, latestProof: { id: body.proof.id, status: 'pending' } })
})

test('sending the same submission again returns the first result and stores nothing more', async () => {
  const member = await registerCustomer(server.baseUrl, phone())
  const { booking } = await bookFor(member.customerId)
  const submissionId = crypto.randomUUID()
  const first = await (await send(`/bookings/${booking.id}/proofs`, member, [{ bytes: JPEG, name: 'a.jpg' }], submissionId)).json() as ProofSubmissionResponse
  const again = await send(`/bookings/${booking.id}/proofs`, member, [{ bytes: JPEG, name: 'a.jpg' }], submissionId)
  expect(again.status).toBe(200)
  expect(await again.json()).toMatchObject({ replayed: true, proof: { id: first.proof.id } })
  expect(await db.prisma.paymentProof.count({ where: { bookingId: booking.id } })).toBe(1)
  expect(filesOf(booking.id)).toHaveLength(1)
})

test('files are checked by their bytes and count, and a refused upload stores nothing', async () => {
  const member = await registerCustomer(server.baseUrl, phone())
  const { booking } = await bookFor(member.customerId)
  const disguised = await send(`/bookings/${booking.id}/proofs`, member, [{ bytes: JPEG, name: 'ok.jpg' }, { bytes: Buffer.from('<html>'), name: 'bukti.jpg' }])
  expect(disguised.status).toBe(400)
  expect((await disguised.json()).error).toMatchObject({ code: 'VALIDATION_FAILED', fields: { file1: 'INVALID_FORMAT' } })
  const tooMany = await send(`/bookings/${booking.id}/proofs`, member, [1, 2, 3, 4].map(n => ({ bytes: JPEG, name: `${n}.jpg` })))
  expect((await tooMany.json()).error).toMatchObject({ fields: { files: 'TOO_LONG' } })
  const none = await send(`/bookings/${booking.id}/proofs`, member, [])
  expect((await none.json()).error).toMatchObject({ fields: { files: 'REQUIRED' } })
  expect(filesOf(booking.id)).toHaveLength(0)
  expect((await db.prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe('awaiting_payment')
})

test('past the deadline, under review or paid, a proof is refused with the reason', async () => {
  const member = await registerCustomer(server.baseUrl, phone())
  const late = await bookFor(member.customerId, 'awaiting_payment', new Date(Date.now() - 60_000))
  const review = await bookFor(member.customerId, 'awaiting_verification')
  const paid = await bookFor(member.customerId, 'confirmed')
  const code = async (bookingId: string) => (await (await send(`/bookings/${bookingId}/proofs`, member, [{ bytes: JPEG, name: 'a.jpg' }])).json()).error.code
  expect(await code(late.booking.id)).toBe('PAYMENT_DEADLINE_PASSED')
  expect(await code(review.booking.id)).toBe('BOOKING_NOT_PAYABLE')
  expect(await code(paid.booking.id)).toBe('BOOKING_NOT_PAYABLE')
  expect(filesOf(late.booking.id)).toHaveLength(0)
})

test('after a rejection a new proof can be sent within the same original deadline', async () => {
  const member = await registerCustomer(server.baseUrl, phone())
  const { booking } = await bookFor(member.customerId, 'needs_correction')
  const response = await send(`/bookings/${booking.id}/proofs`, member, [{ bytes: JPEG, name: 'baru.jpg' }])
  expect(response.status).toBe(201)
  const stored = await db.prisma.booking.findUniqueOrThrow({ where: { id: booking.id } })
  expect(stored).toMatchObject({ status: 'awaiting_verification', originalDeadline: booking.originalDeadline })
})

test('only the signed-in owner can send proof, from the app, with its CSRF token', async () => {
  const member = await registerCustomer(server.baseUrl, phone())
  const other = await registerCustomer(server.baseUrl, phone())
  const { booking } = await bookFor(member.customerId)
  const path = `/bookings/${booking.id}/proofs`
  expect((await send(path, other, [{ bytes: JPEG, name: 'a.jpg' }])).status).toBe(404)
  expect((await send(path, { cookie: '', csrfToken: '' }, [{ bytes: JPEG, name: 'a.jpg' }])).status).toBe(401)
  expect((await send(path, { ...member, csrfToken: 'wrong' }, [{ bytes: JPEG, name: 'a.jpg' }])).status).toBe(403)
  expect((await send(path, member, [{ bytes: JPEG, name: 'a.jpg' }], undefined, { Origin: 'https://evil.example' })).status).toBe(403)
  expect((await get(`/bookings/${booking.id}/payment`, other.cookie)).status).toBe(404)
  expect(filesOf(booking.id)).toHaveLength(0)
})

test('if the deadline passes while the upload is being saved, nothing is kept', async () => {
  const member = await registerCustomer(server.baseUrl, phone())
  const deadline = new Date(Date.now() + HOUR)
  const { booking } = await bookFor(member.customerId, 'awaiting_payment', deadline)
  // The first reading of the clock is before the deadline (checks pass); by the time of the save it has passed.
  let reads = 0
  const clock = () => new Date(reads++ < 1 ? deadline.getTime() - 1000 : deadline.getTime() + 1000)
  await expect(submitProof(db.prisma, privateDir, member.customerId, booking.id, { submissionId: crypto.randomUUID(), files: [{ bytes: JPEG, name: 'a.jpg' }] }, clock))
    .rejects.toMatchObject({ code: 'PAYMENT_DEADLINE_PASSED' })
  expect(filesOf(booking.id)).toHaveLength(0)
  expect(await db.prisma.paymentProof.count({ where: { bookingId: booking.id } })).toBe(0)
})
