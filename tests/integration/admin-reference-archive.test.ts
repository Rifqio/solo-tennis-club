import { randomUUID } from 'node:crypto'
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
const uploadsDir = mkdtempSync(resolve(tmpdir(), 'stc-uploads-'))
beforeAll(async () => {
  db = await createTestDatabase()
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development', uploadsDir }))
  auth = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma))
})
afterAll(async () => { await server?.close(); await db?.cleanup(); rmSync(uploadsDir, { recursive: true, force: true }) })

const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) })
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)])

test('archiving hides a coach from lists, counts and new picks but keeps it restorable, with version checks', async () => {
  const catalog = await createSampleCatalog(db.prisma)
  const coach = catalog.coaches[0]
  const before = await (await adminFetch(server.baseUrl, auth, '/reference-counts')).json()
  expect((await adminFetch(server.baseUrl, auth, `/coaches/${coach.id}/archive`, json({ version: 99 }))).status).toBe(409)
  const archived = await (await adminFetch(server.baseUrl, auth, `/coaches/${coach.id}/archive`, json({ version: 1 }))).json()
  expect(archived).toMatchObject({ id: coach.id, archived: true, version: 2, classCount: 1 })
  expect((await (await adminFetch(server.baseUrl, auth, '/reference-counts')).json()).coach).toBe(before.coach - 1)
  const active = await (await adminFetch(server.baseUrl, auth, `/coaches?q=${encodeURIComponent(coach.name)}`)).json()
  expect(active.items).toHaveLength(0)
  const archive = await (await adminFetch(server.baseUrl, auth, `/coaches?archived=1&q=${encodeURIComponent(coach.name)}`)).json()
  expect(archive.items.map((row: { id: string }) => row.id)).toEqual([coach.id])
  const options = await (await adminFetch(server.baseUrl, auth, '/session-options')).json()
  expect(options.coaches.find((row: { id: string }) => row.id === coach.id)).toMatchObject({ archived: true })
  // The class that already uses it keeps it.
  const tennisClass = await (await adminFetch(server.baseUrl, auth, `/classes/${catalog.tennisClass.id}`)).json()
  expect(tennisClass.defaultCoachIds).toContain(coach.id)
  const restored = await (await adminFetch(server.baseUrl, auth, `/coaches/${coach.id}/restore`, json({ version: 2 }))).json()
  expect(restored).toMatchObject({ archived: false, version: 3 })
  expect((await adminFetch(server.baseUrl, auth, `/coaches/${coach.id}`, { method: 'DELETE', body: '{}' })).status).toBe(404)
})

test('usage lists the classes using a coach, level or venue with each class\'s next scheduled session', async () => {
  const catalog = await createSampleCatalog(db.prisma)
  const next = clubDateTimeToInstant(addClubDays(clubToday(), 3), '07:00')
  await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(addClubDays(clubToday(), 5), '07:00') })
  await createSampleSession(db.prisma, { catalog, startsAt: next })
  await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(addClubDays(clubToday(), 2), '07:00'), status: 'cancelled' })
  for (const path of [`/coaches/${catalog.coaches[1].id}`, `/levels/${catalog.level.id}`, `/venues/${catalog.venue.id}`]) {
    const usage = await (await adminFetch(server.baseUrl, auth, path + '/usage')).json()
    expect(usage.classes).toEqual([{ id: catalog.tennisClass.id, name: catalog.tennisClass.name, levelName: catalog.level.name, venueName: catalog.venue.name, durationMinutes: 90, nextSessionAt: next.toISOString() }])
  }
  const unused = await (await adminFetch(server.baseUrl, auth, '/coaches', json({ name: 'Unused ' + randomUUID(), createRequestId: randomUUID() }))).json()
  expect(await (await adminFetch(server.baseUrl, auth, `/coaches/${unused.id}/usage`)).json()).toEqual({ classes: [] })
  expect((await adminFetch(server.baseUrl, auth, '/coaches/missing0000/usage')).status).toBe(404)
})

test('coach photo upload checks the bytes, size, origin and CSRF, serves the file, and cleans up replaced uploads', async () => {
  const { coaches: [coach] } = await createSampleCatalog(db.prisma)
  const upload = (body: Buffer, headers: Record<string, string> = {}) => adminFetch(server.baseUrl, auth, `/coaches/${coach.id}/photo`, { method: 'PUT', body, headers: { 'Content-Type': 'image/png', ...headers } })
  expect((await upload(PNG, { 'X-CSRF-Token': '' })).status).toBe(403)
  expect((await upload(PNG, { Origin: 'http://evil.example' })).status).toBe(403)
  const notImage = await upload(Buffer.from('<svg onload="alert(1)"></svg>'))
  expect(notImage.status).toBe(400)
  expect(await notImage.json()).toMatchObject({ error: { fields: { photo: 'INVALID_FORMAT' } } })
  expect((await upload(Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]))).status).toBe(413)

  const first = await (await upload(PNG)).json()
  expect(first.photoUrl).toMatch(/^\/uploads\/coaches\/[a-z0-9]+-[0-9a-f]{12}\.png$/)
  const served = await fetch(server.baseUrl + first.photoUrl)
  expect(served.status).toBe(200)
  expect(served.headers.get('content-type')).toBe('image/png')
  const firstFile = resolve(uploadsDir, 'coaches', first.photoUrl.split('/').pop())
  expect(existsSync(firstFile)).toBe(true)

  const second = await (await upload(PNG)).json()
  expect(second.photoUrl).not.toBe(first.photoUrl)
  expect(existsSync(firstFile)).toBe(false)

  const removed = await (await adminFetch(server.baseUrl, auth, `/coaches/${coach.id}/photo`, { method: 'DELETE' })).json()
  expect(removed.photoUrl).toBeNull()
  expect(existsSync(resolve(uploadsDir, 'coaches', second.photoUrl.split('/').pop()))).toBe(false)
  // An encoded ../ reaches the server as-is and must not escape the uploads folder.
  const traversal = await fetch(server.baseUrl + '/uploads/..%2f..%2fpackage.json')
  expect(traversal.status).not.toBe(200)
  expect(await traversal.text()).not.toContain('"scripts"')
})
