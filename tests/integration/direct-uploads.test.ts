import { randomBytes } from 'node:crypto'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { createBlobStore, createDiskStore, type FileStore } from '../../server/storage/file-store.ts'
import { issueUploadTicket } from '../../server/storage/staged-upload.ts'
import { addClubDays, clubDateTimeToInstant, clubToday } from '../../shared/club-time.ts'
import type { UploadTicketResponse } from '../../shared/api/uploads.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { adminFetch, provisionTestAdmin, signInAs } from '../support/admin-fixtures.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { registerCustomer } from '../support/customer-fixtures.ts'

// The hosted demo's upload path, driven with folder stores: the browser has already put a file under
// incoming/<purpose>/<random>.bin and now names it instead of sending it.
const HOUR = 3600_000
const uploadsDir = mkdtempSync(resolve(tmpdir(), 'stc-direct-uploads-'))
const privateDir = mkdtempSync(resolve(tmpdir(), 'stc-direct-private-'))
const privateFiles = createDiskStore(privateDir)
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let admin: Awaited<ReturnType<typeof signInAs>>

beforeAll(async () => {
  db = await createTestDatabase()
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development', uploadsDir, privateDir }))
  admin = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma))
})
afterAll(async () => {
  await server?.close(); await db?.cleanup()
  rmSync(uploadsDir, { recursive: true, force: true }); rmSync(privateDir, { recursive: true, force: true })
})

function png(width: number, height: number) {
  const header = Buffer.alloc(33)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header, 0)
  header.writeUInt32BE(13, 8)
  header.write('IHDR', 12, 'ascii')
  header.writeUInt32BE(width, 16)
  header.writeUInt32BE(height, 20)
  return Buffer.concat([header, Buffer.alloc(64, 7)])
}
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32, 1)])

async function stage(store: FileStore, purpose: string, bytes: Buffer) {
  const key = `incoming/${purpose}/${randomBytes(16).toString('hex')}.bin`
  await store.put(key, bytes, 'application/octet-stream')
  return key
}
const incomingLeft = (purpose: string) => existsSync(resolve(privateDir, 'incoming', purpose)) ? readdirSync(resolve(privateDir, 'incoming', purpose)) : []

test('without Blob tokens a ticket says to send the file in the request', async () => {
  expect(await issueUploadTicket('photo', '')).toEqual({ direct: false })
  const ticket = await adminFetch(server.baseUrl, admin, '/uploads', { method: 'POST', body: JSON.stringify({ purpose: 'photo' }) })
  expect(ticket.status).toBe(200)
  expect(await ticket.json() as UploadTicketResponse).toEqual({ direct: false })
  expect((await adminFetch(server.baseUrl, admin, '/uploads', { method: 'POST', body: JSON.stringify({ purpose: 'proof' }) })).status).toBe(400)
  expect((await fetch(server.baseUrl + '/api/admin/uploads', { method: 'POST', headers: { Origin: server.baseUrl, 'Content-Type': 'application/json' }, body: '{"purpose":"photo"}' })).status).toBe(401)
})

test('a ticket with a token allows exactly one incoming key for its purpose', async () => {
  const ticket = await issueUploadTicket('proof', 'vercel_blob_rw_teststore123_secretpart')
  expect(ticket.direct).toBe(true)
  if (!ticket.direct) return
  expect(ticket.key).toMatch(/^incoming\/proof\/[a-f0-9]{32}\.bin$/)
  expect(ticket.access).toBe('private')
  expect(ticket.token.length).toBeGreaterThan(20)
})

test('an admin photo named by its incoming key is checked, stored publicly, and the incoming copy removed', async () => {
  const catalog = await createSampleCatalog(db.prisma)
  const session = await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(addClubDays(clubToday(), -1), '06:00'), durationMinutes: 60 })
  const post = (key: unknown) => adminFetch(server.baseUrl, admin, `/sessions/${session.id}/photos`, { method: 'POST', body: JSON.stringify({ key }) })

  const created = await post(await stage(privateFiles, 'photo', png(1600, 1200)))
  expect(created.status).toBe(201)
  const photo = await created.json() as { url: string; width: number; height: number }
  expect(photo).toMatchObject({ width: 1600, height: 1200 })
  expect((await fetch(server.baseUrl + photo.url)).status).toBe(200)
  expect(incomingLeft('photo')).toEqual([])

  const notImage = await post(await stage(privateFiles, 'photo', Buffer.from('plain text')))
  expect(notImage.status).toBe(400)
  expect(incomingLeft('photo')).toEqual([])
  expect((await post('incoming/photo/../../proofs/x.bin')).status).toBe(400)
  // A key issued for another purpose is refused and left alone.
  const proofKey = await stage(privateFiles, 'proof', png(10, 10))
  expect((await post(proofKey)).status).toBe(400)
  await privateFiles.remove([proofKey])
  expect((await post(`incoming/photo/${'a'.repeat(32)}.bin`)).status).toBe(400)
})

test('a coach portrait can arrive by incoming key too', async () => {
  const coach = await db.prisma.coach.create({ data: { name: 'Direct coach', nameKey: 'direct coach' } })
  const saved = await adminFetch(server.baseUrl, admin, `/coaches/${coach.id}/photo`, { method: 'PUT', body: JSON.stringify({ key: await stage(privateFiles, 'coach', JPEG) }) })
  expect(saved.status).toBe(200)
  const record = await saved.json() as { photoUrl: string }
  expect(record.photoUrl).toMatch(/^\/uploads\/coaches\//)
  expect(incomingLeft('coach')).toEqual([])
})

test('a member sends proof by incoming keys; the files are checked and kept privately', async () => {
  const member = await registerCustomer(server.baseUrl, '+6281234590001', 'Direct member')
  const catalog = await createSampleCatalog(db.prisma)
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 72 * HOUR) })
  const booking = await db.prisma.booking.create({ data: {
    sessionId: session.id, customerId: member.customerId, actorId: member.customerId, createRequestId: crypto.randomUUID(), fingerprint: 'test',
    status: 'awaiting_payment', bookerName: 'Andy', bookerPhone: '+6281200000000', quantity: 1, unitPriceIdr: 100000, totalPriceIdr: 100000,
    originalDeadline: new Date(Date.now() + 2 * HOUR), participants: { create: [{ position: 1, name: 'P1' }] },
  } })
  const customerPost = (path: string, body: unknown) => fetch(server.baseUrl + '/api/customer' + path, {
    method: 'POST', body: JSON.stringify(body),
    headers: { Origin: server.baseUrl, 'Content-Type': 'application/json', Cookie: member.cookie, 'X-CSRF-Token': member.csrfToken },
  })
  expect(await (await customerPost('/uploads', {})).json()).toEqual({ direct: false })

  const rejected = await customerPost(`/bookings/${booking.id}/proofs`, { submissionId: crypto.randomUUID(), files: [{ key: await stage(privateFiles, 'proof', Buffer.from('<html>')), name: 'x.jpg' }] })
  expect(rejected.status).toBe(400)
  expect(incomingLeft('proof')).toEqual([])

  const sent = await customerPost(`/bookings/${booking.id}/proofs`, { submissionId: crypto.randomUUID(), files: [{ key: await stage(privateFiles, 'proof', JPEG), name: 'bukti.jpg' }] })
  expect(sent.status).toBe(201)
  expect(readdirSync(resolve(privateDir, 'proofs', booking.id))).toHaveLength(1)
  expect(incomingLeft('proof')).toEqual([])
})

test('on Blob, /uploads redirects to the public store and never to the private one', async () => {
  const token = 'vercel_blob_rw_PubStore42_secret'
  const files = { publicFiles: createBlobStore({ access: 'public', token }), privateFiles: createBlobStore({ access: 'private', token: 'vercel_blob_rw_PrivStore7_secret' }) }
  expect(files.privateFiles.publicUrl('proofs/abc/x.jpg')).toBeNull()
  const blobServer = await startTestServer(createApp({ prisma: db.prisma, mode: 'development', files }))
  try {
    const photo = await fetch(blobServer.baseUrl + `/uploads/sessions/abc123/${'a'.repeat(32)}.webp`, { redirect: 'manual' })
    expect(photo.status).toBe(308)
    expect(photo.headers.get('location')).toBe(`https://pubstore42.public.blob.vercel-storage.com/sessions/abc123/${'a'.repeat(32)}.webp`)
    expect((await fetch(blobServer.baseUrl + '/uploads/sessions/%2e%2e/x.jpg', { redirect: 'manual' })).headers.get('location')).toBeNull()
  } finally { await blobServer.close() }
})
