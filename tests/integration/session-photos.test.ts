import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { addClubDays, clubDateTimeToInstant, clubToday } from '../../shared/club-time.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { adminFetch, provisionTestAdmin, signInAs } from '../support/admin-fixtures.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'

let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let auth: Awaited<ReturnType<typeof signInAs>>
// Uploads go to a throwaway folder, never the project's data/uploads.
const uploadsDir = mkdtempSync(resolve(tmpdir(), 'stc-photos-'))
beforeAll(async () => {
  db = await createTestDatabase()
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development', uploadsDir }))
  auth = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma))
})
afterAll(async () => { await server?.close(); await db?.cleanup(); rmSync(uploadsDir, { recursive: true, force: true }) })

// A PNG header is enough for the server: it reads the kind and the size from the first bytes.
function png(width: number, height: number) {
  const header = Buffer.alloc(33)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header, 0)
  header.writeUInt32BE(13, 8)
  header.write('IHDR', 12, 'ascii')
  header.writeUInt32BE(width, 16)
  header.writeUInt32BE(height, 20)
  return Buffer.concat([header, Buffer.alloc(64, 7)])
}
const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) })

async function finishedSession(daysAgo: number) {
  const catalog = await createSampleCatalog(db.prisma)
  return createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(addClubDays(clubToday(), -daysAgo), '06:00'), durationMinutes: 60 })
}

test('an admin uploads photos one by one; the server checks the bytes, size, origin and CSRF and serves them publicly', async () => {
  const session = await finishedSession(1)
  const upload = (body: Buffer, headers: Record<string, string> = {}) => adminFetch(server.baseUrl, auth, `/sessions/${session.id}/photos`,
    { method: 'POST', body: new Uint8Array(body), headers: { 'Content-Type': 'image/png', ...headers } })

  const notImage = await upload(Buffer.from('not an image at all'))
  expect(notImage.status).toBe(400)
  expect(await notImage.json()).toMatchObject({ error: { fields: { photo: 'INVALID_FORMAT' } } })
  expect((await upload(png(800, 600), { 'X-CSRF-Token': 'wrong' })).status).toBe(403)
  expect((await upload(png(800, 600), { Origin: 'https://elsewhere.example' })).status).toBe(403)
  expect((await fetch(`${server.baseUrl}/api/admin/sessions/${session.id}/photos`, { method: 'POST', body: new Uint8Array(png(8, 8)), headers: { 'Content-Type': 'image/png' } })).status).toBe(401)

  const first = await upload(png(1200, 900))
  expect(first.status).toBe(201)
  const photo = await first.json()
  expect(photo).toMatchObject({ width: 1200, height: 900, isCover: false })
  expect(photo.url).toMatch(new RegExp(`^/uploads/sessions/${session.id}/[0-9a-f]{32}\\.png$`))
  const served = await fetch(server.baseUrl + photo.url)
  expect(served.status).toBe(200)
  expect(served.headers.get('content-type')).toBe('image/png')
  await upload(png(600, 900))

  const album = await (await adminFetch(server.baseUrl, auth, `/sessions/${session.id}/photos`)).json()
  expect(album.photos.map((row: { width: number }) => row.width)).toEqual([1200, 600])
  // Until the admin picks one, the first photo is the thumbnail.
  expect(album.photos.map((row: { isCover: boolean }) => row.isCover)).toEqual([true, false])
  expect((await adminFetch(server.baseUrl, auth, '/sessions/nope/photos')).status).toBe(404)
})

test('thumbnail, delete with Urungkan, and the public album, list and zip', async () => {
  const session = await finishedSession(2)
  const ids: string[] = []
  for (const size of [[1000, 750], [750, 1000], [900, 900]]) {
    const response = await adminFetch(server.baseUrl, auth, `/sessions/${session.id}/photos`, { method: 'POST', body: new Uint8Array(png(size[0], size[1])), headers: { 'Content-Type': 'image/png' } })
    ids.push((await response.json()).id)
  }
  const base = `/sessions/${session.id}/photos`
  const covered = await (await adminFetch(server.baseUrl, auth, `${base}/cover`, json('PUT', { photoId: ids[2] }))).json()
  expect(covered.photos.find((row: { isCover: boolean }) => row.isCover).id).toBe(ids[2])
  expect((await adminFetch(server.baseUrl, auth, `${base}/cover`, json('PUT', { photoId: 'someone-else' }))).status).toBe(404)

  const afterDelete = await (await adminFetch(server.baseUrl, auth, `${base}/delete`, json('POST', { photoIds: [ids[0], ids[2]] }))).json()
  expect(afterDelete.photos.map((row: { id: string }) => row.id)).toEqual([ids[1]])
  // The file stays until the photo is purged, so Urungkan brings it back whole.
  const kept = await db.prisma.sessionPhoto.findUniqueOrThrow({ where: { id: ids[0] } })
  expect(existsSync(resolve(uploadsDir, kept.url.slice('/uploads/'.length)))).toBe(true)
  const restored = await (await adminFetch(server.baseUrl, auth, `${base}/restore`, json('POST', { photoIds: [ids[0], ids[2]] }))).json()
  expect(restored.photos.map((row: { id: string }) => row.id)).toEqual(ids)
  expect((await adminFetch(server.baseUrl, auth, `${base}/delete`, json('POST', { photoIds: [] }))).status).toBe(400)

  const publicAlbum = await (await fetch(`${server.baseUrl}/api/public/sessions/${session.id}/photos`)).json()
  expect(publicAlbum.photos).toHaveLength(3)
  expect(publicAlbum.session).toMatchObject({ id: session.id, startTime: '06:00', endTime: '07:00' })
  expect(publicAlbum.updatedAt).toEqual(expect.any(String))
  const recent = await (await fetch(`${server.baseUrl}/api/public/albums?limit=48`)).json()
  expect(recent.albums.find((row: { session: { id: string } }) => row.session.id === session.id)).toMatchObject({ count: 3 })

  const zip = await fetch(`${server.baseUrl}/api/public/sessions/${session.id}/photos.zip`)
  expect(zip.status).toBe(200)
  expect(zip.headers.get('content-type')).toBe('application/zip')
  const bytes = Buffer.from(await zip.arrayBuffer())
  expect(bytes.readUInt32LE(0)).toBe(0x04034b50)
  expect(bytes.readUInt16LE(bytes.length - 22 + 10)).toBe(3)
})

test('a cancelled session has no public album and takes no uploads', async () => {
  const catalog = await createSampleCatalog(db.prisma)
  const session = await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(addClubDays(clubToday(), -1), '08:00'), status: 'cancelled' })
  expect((await fetch(`${server.baseUrl}/api/public/sessions/${session.id}/photos`)).status).toBe(404)
  expect((await adminFetch(server.baseUrl, auth, `/sessions/${session.id}/photos`, { method: 'POST', body: new Uint8Array(png(10, 10)), headers: { 'Content-Type': 'image/png' } })).status).toBe(409)
})

test('the Sesi list reminds the admin of the newest finished session without photos', async () => {
  await db.prisma.sessionPhoto.deleteMany()
  await db.prisma.classSession.updateMany({ where: { startsAt: { lt: new Date() } }, data: { status: 'cancelled' } })
  const older = await finishedSession(3)
  const newer = await finishedSession(1)
  const list = async () => (await (await adminFetch(server.baseUrl, auth, '/sessions')).json()).photoReminder
  expect((await list())?.id).toBe(newer.id)
  await adminFetch(server.baseUrl, auth, `/sessions/${newer.id}/photos`, { method: 'POST', body: new Uint8Array(png(10, 10)), headers: { 'Content-Type': 'image/png' } })
  expect((await list())?.id).toBe(older.id)
})
