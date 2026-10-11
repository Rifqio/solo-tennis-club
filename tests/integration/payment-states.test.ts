import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { expireDueBookings } from '../../server/features/booking-expiry/expiry.service.ts'
import { getOccupiedPlaceCounts } from '../../server/features/capacity/occupancy.ts'
import { evidencePath, sniffEvidence, storeEvidence } from '../../server/features/payments/evidence-storage.ts'
import { backupPrivate } from '../../server/ops/backup.ts'
import { effectiveBookingStatus } from '../../shared/booking-rules.ts'
import type { AdminBookingListResponse } from '../../shared/api/admin-bookings.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { registerCustomer } from '../support/customer-fixtures.ts'
import { adminFetch, provisionTestAdmin, signInAs } from '../support/admin-fixtures.ts'

const HOUR = 60 * 60 * 1000
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
const PDF = Buffer.from('%PDF-1.4\n%test\n')
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
let admin: Awaited<ReturnType<typeof signInAs>>
const privateDir = mkdtempSync(resolve(tmpdir(), 'stc-private-'))
let phoneIndex = 7000
const phone = () => '+628123458' + String(phoneIndex++)

beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development', privateDir }))
  admin = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma))
})
afterAll(async () => { await server?.close(); await db?.cleanup(); rmSync(privateDir, { recursive: true, force: true }) })

async function book(sessionId: string, status: string, deadline: Date, places = 1, customerId: string | null = null) {
  return db.prisma.booking.create({ data: {
    sessionId, customerId, actorId: customerId ?? 'admin', createRequestId: crypto.randomUUID(), fingerprint: 'test', status,
    bookerName: 'Pemesan', bookerPhone: '+6281200000000', quantity: places, unitPriceIdr: 100000, totalPriceIdr: 100000 * places,
    originalDeadline: deadline, participants: { create: Array.from({ length: places }, (_, index) => ({ position: index + 1, name: `P${index + 1}` })) },
  } })
}

test('each payment state holds places exactly as 03-ARCHITECTURE §2 says', async () => {
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 72 * HOUR) })
  const now = new Date()
  const ahead = new Date(now.getTime() + HOUR)
  const passed = new Date(now.getTime() - HOUR)
  await book(session.id, 'awaiting_payment', ahead, 1)       // holds
  await book(session.id, 'awaiting_payment', passed, 2)      // released at the deadline
  await book(session.id, 'needs_correction', ahead, 4)       // holds until the same deadline
  await book(session.id, 'needs_correction', passed, 8)      // released
  await book(session.id, 'awaiting_verification', passed, 16) // holds past the deadline (PAY-04)
  await book(session.id, 'confirmed', passed, 32)            // holds
  await book(session.id, 'expired', ahead, 64)               // never holds
  expect((await getOccupiedPlaceCounts(db.prisma, [session.id], now)).get(session.id)).toBe(1 + 4 + 16 + 32)
})

test('the effective status expires only deadline-bound states', () => {
  const now = new Date()
  const passed = new Date(now.getTime() - 1)
  expect(effectiveBookingStatus('awaiting_payment', passed, now)).toBe('expired')
  expect(effectiveBookingStatus('needs_correction', passed, now)).toBe('expired')
  expect(effectiveBookingStatus('awaiting_verification', passed, now)).toBe('awaiting_verification')
  expect(effectiveBookingStatus('confirmed', passed, now)).toBe('confirmed')
  expect(effectiveBookingStatus('something_else', now, now)).toBe('expired')
})

test('the expiry worker writes expired for unpaid and needs-correction bookings, never for a proof under review', async () => {
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 72 * HOUR) })
  const passed = new Date(Date.now() - HOUR)
  const unpaid = await book(session.id, 'awaiting_payment', passed)
  const correction = await book(session.id, 'needs_correction', passed)
  const review = await book(session.id, 'awaiting_verification', passed)
  const paid = await book(session.id, 'confirmed', passed)
  await expireDueBookings(db.prisma, new Date())
  const status = async (id: string) => (await db.prisma.booking.findUniqueOrThrow({ where: { id } })).status
  expect(await status(unpaid.id)).toBe('expired')
  expect(await status(correction.id)).toBe('expired')
  expect(await status(review.id)).toBe('awaiting_verification')
  expect(await status(paid.id)).toBe('confirmed')
})

test('Belum bayar lists only bookings that still owe payment, not paid ones or proofs under review', async () => {
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 72 * HOUR) })
  const ahead = new Date(Date.now() + 2 * HOUR)
  const owes = await book(session.id, 'awaiting_payment', ahead)
  const fix = await book(session.id, 'needs_correction', ahead)
  const review = await book(session.id, 'awaiting_verification', ahead)
  const paid = await book(session.id, 'confirmed', ahead)
  const body = await (await adminFetch(server.baseUrl, admin, '/bookings?status=unpaid')).json() as AdminBookingListResponse
  const ids = body.items.map(item => item.id)
  expect(ids).toEqual(expect.arrayContaining([owes.id, fix.id]))
  expect(ids).not.toContain(review.id)
  expect(ids).not.toContain(paid.id)
})

test('evidence files are recognised by their bytes and stored without path tricks', () => {
  expect(sniffEvidence(JPEG)?.contentType).toBe('image/jpeg')
  expect(sniffEvidence(PDF)?.contentType).toBe('application/pdf')
  expect(sniffEvidence(Buffer.from('<script>alert(1)</script>'))).toBeNull()
  const [stored] = storeEvidence(privateDir, 'bookingx', [{ bytes: JPEG, kind: sniffEvidence(JPEG)! }])
  expect(readFileSync(evidencePath(privateDir, 'bookingx', stored!.fileName))).toEqual(JPEG)
  expect(existsSync(evidencePath(privateDir, 'bookingx', stored!.fileName) + '.part')).toBe(false)
  expect(() => evidencePath(privateDir, 'bookingx', '../lafu.db')).toThrow()
  expect(() => evidencePath(privateDir, '../etc', stored!.fileName)).toThrow()
})

test('a proof file reaches only its booker and admins; everyone else gets 404 or 401', async () => {
  const owner = await registerCustomer(server.baseUrl, phone(), 'Andy')
  const other = await registerCustomer(server.baseUrl, phone(), 'Dmitri')
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 72 * HOUR) })
  const booking = await book(session.id, 'awaiting_verification', new Date(Date.now() + HOUR), 1, owner.customerId)
  const files = storeEvidence(privateDir, booking.id, [{ bytes: JPEG, kind: sniffEvidence(JPEG)! }, { bytes: PDF, kind: sniffEvidence(PDF)! }])
  const proof = await db.prisma.paymentProof.create({ data: {
    bookingId: booking.id, customerId: owner.customerId, submissionId: crypto.randomUUID(),
    files: { create: files.map((file, index) => ({ position: index + 1, fileName: file.fileName, originalName: index ? 'transfer.pdf' : 'bukti bayar.jpg', contentType: file.kind.contentType, byteSize: file.byteSize })) },
  }, include: { files: { orderBy: { position: 'asc' } } } })
  const [image, pdf] = proof.files
  const customerPath = (fileId: string) => `/api/customer/bookings/${booking.id}/proofs/${proof.id}/files/${fileId}`
  const get = (path: string, cookie = '') => fetch(server.baseUrl + path, { headers: { Origin: server.baseUrl, Accept: '*/*', Cookie: cookie } })

  const mine = await get(customerPath(image!.id), owner.cookie)
  expect(mine.status).toBe(200)
  expect(mine.headers.get('content-type')).toBe('image/jpeg')
  expect(mine.headers.get('cache-control')).toBe('private, no-store')
  expect(mine.headers.get('x-content-type-options')).toBe('nosniff')
  expect(mine.headers.get('content-disposition')).toContain('inline')
  expect(Buffer.from(await mine.arrayBuffer())).toEqual(JPEG)
  expect((await get(customerPath(pdf!.id), owner.cookie)).headers.get('content-disposition')).toContain('attachment')

  expect((await get(customerPath(image!.id), other.cookie)).status).toBe(404)
  expect((await get(customerPath(image!.id))).status).toBe(401)
  expect((await get(customerPath('unknown123'), owner.cookie)).status).toBe(404)
  // No public path reaches the private folder: whatever answers, it is never the proof's bytes.
  for (const path of [`/uploads/../private/proofs/${booking.id}/${files[0]!.fileName}`, `/private/proofs/${booking.id}/${files[0]!.fileName}`]) {
    const leaked = await get(path)
    expect(Buffer.from(await leaked.arrayBuffer()).equals(JPEG)).toBe(false)
  }

  const asAdmin = await adminFetch(server.baseUrl, admin, `/proofs/${proof.id}/files/${image!.id}`)
  expect(asAdmin.status).toBe(200)
  expect(Buffer.from(await asAdmin.arrayBuffer())).toEqual(JPEG)
  expect((await adminFetch(server.baseUrl, admin, `/proofs/${proof.id}/files/unknown123`)).status).toBe(404)
  expect((await get(`/api/admin/proofs/${proof.id}/files/${image!.id}`)).status).toBe(401)
})

test('a backup carries the private files', () => {
  const backupDir = mkdtempSync(resolve(tmpdir(), 'stc-backup-'))
  try {
    const target = backupPrivate(privateDir, resolve(backupDir, 'lafu-test.db'))
    expect(target && existsSync(resolve(target, 'proofs'))).toBe(true)
  } finally { rmSync(backupDir, { recursive: true, force: true }) }
})
