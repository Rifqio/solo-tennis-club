import { randomUUID } from 'node:crypto'
import { beforeAll, afterAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { provisionTestAdmin, signInAs, adminFetch } from '../support/admin-fixtures.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { clubDateOf } from '../../shared/club-time.ts'
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let auth: Awaited<ReturnType<typeof signInAs>>
beforeAll(async () => { db = await createTestDatabase(); server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' })); auth = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma)) })
afterAll(async () => { await server?.close(); await db?.cleanup() })
for (const path of ['coaches', 'venues', 'levels']) {
  test(`${path}: guarded CRUD, normalized uniqueness, idempotency, version conflict, and no delete`, async () => {
    const name = 'Reference ' + randomUUID()
    const input = { name, createRequestId: randomUUID(), ...(path === 'venues' ? { address: 'Sample test address' } : {}) }
    expect((await fetch(server.baseUrl + `/api/admin/${path}`)).status).toBe(401)
    expect((await adminFetch(server.baseUrl, auth, `/${path}`, { method: 'POST', body: JSON.stringify(input), headers: { 'X-CSRF-Token': '' } })).status).toBe(403)
    const create = () => adminFetch(server.baseUrl, auth, `/${path}`, { method: 'POST', body: JSON.stringify(input) })
    const response = await create(); expect(response.status).toBe(200)
    const row = await response.json(); expect(row).toMatchObject({ name, version: 1 })
    expect(await (await create()).json()).toMatchObject({ id: row.id, version: 1 })
    const duplicate = await adminFetch(server.baseUrl, auth, `/${path}`, { method: 'POST', body: JSON.stringify({ ...input, name: '  ' + name.toUpperCase().replace(' ', '  ') + '  ', createRequestId: randomUUID() }) })
    expect(duplicate.status).toBe(409); expect(await duplicate.json()).toMatchObject({ error: { code: 'DUPLICATE_NAME', fields: { name: 'DUPLICATE_NAME' } } })
    const update = await adminFetch(server.baseUrl, auth, `/${path}/${row.id}`, { method: 'PUT', body: JSON.stringify({ name: name + ' edited', version: 1, ...(path === 'venues' ? { address: 'Edited address' } : {}) }) })
    expect(await update.json()).toMatchObject({ id: row.id, version: 2, name: name + ' edited' })
    const stale = await adminFetch(server.baseUrl, auth, `/${path}/${row.id}`, { method: 'PUT', body: JSON.stringify({ name: 'Stale edit', version: 1 }) })
    expect(stale.status).toBe(409); expect(await stale.json()).toMatchObject({ error: { code: 'STALE_VERSION', latest: { version: 2 } } })
    const list = await (await adminFetch(server.baseUrl, auth, `/${path}`)).json()
    expect(list.filter((record: { id: string }) => record.id === row.id)).toHaveLength(1)
    expect((await adminFetch(server.baseUrl, auth, `/${path}/${row.id}`, { method: 'DELETE', body: '{}' })).status).toBe(404)
    const invalid = await adminFetch(server.baseUrl, auth, `/${path}`, { method: 'POST', body: JSON.stringify({ name: 'x'.repeat(121), createRequestId: randomUUID() }) })
    expect(invalid.status).toBe(400); expect(await invalid.json()).toMatchObject({ error: { fields: { name: 'TOO_LONG' } } })
  })
}
test('venue rename propagates to existing public sessions without leaking internal fields', async () => {
  const catalog = await createSampleCatalog(db.prisma)
  const session = await createSampleSession(db.prisma, { catalog })
  const response = await adminFetch(server.baseUrl, auth, `/venues/${catalog.venue.id}`, { method: 'PUT', body: JSON.stringify({ name: 'Renamed test venue', version: 1 }) })
  expect(response.status).toBe(200)
  const schedule = await (await fetch(server.baseUrl + '/api/public/schedule?date=' + clubDateOf(session.startsAt))).json()
  expect(schedule.sessions.find((row: { id: string }) => row.id === session.id).venueName).toBe('Renamed test venue')
})
test('a venue keeps its Maps link and pin, and the public sees the link', async () => {
  const catalog = await createSampleCatalog(db.prisma)
  const session = await createSampleSession(db.prisma, { catalog })
  const save = (body: object) => adminFetch(server.baseUrl, auth, `/venues/${catalog.venue.id}`, { method: 'PUT', body: JSON.stringify(body) })
  const current = await (await adminFetch(server.baseUrl, auth, `/venues/${catalog.venue.id}`)).json()
  const missingPin = await save({ name: current.name, version: current.version, mapUrl: 'https://maps.app.goo.gl/AbC123' })
  expect(missingPin.status).toBe(400); expect(await missingPin.json()).toMatchObject({ error: { fields: { mapUrl: 'MAP_LINK_UNREADABLE' } } })
  const notMaps = await save({ name: current.name, version: current.version, mapUrl: 'https://example.com/x', latitude: -7.5, longitude: 110.8 })
  expect(notMaps.status).toBe(400); expect(await notMaps.json()).toMatchObject({ error: { fields: { mapUrl: 'INVALID_FORMAT' } } })
  const saved = await save({ name: current.name, version: current.version, mapUrl: 'https://maps.app.goo.gl/AbC123', latitude: -7.51, longitude: 110.81 })
  expect(await saved.json()).toMatchObject({ mapUrl: 'https://maps.app.goo.gl/AbC123', latitude: -7.51, longitude: 110.81 })
  const detail = await (await fetch(server.baseUrl + '/api/public/sessions/' + session.id)).json()
  expect(detail.venueMapUrl).toBe('https://maps.app.goo.gl/AbC123')
  const venues = await (await fetch(server.baseUrl + '/api/public/venues')).json()
  const venue = venues.venues.find((row: { id: string }) => row.id === catalog.venue.id)
  expect(venue).toEqual({ id: catalog.venue.id, name: current.name, address: current.address, mapUrl: 'https://maps.app.goo.gl/AbC123', isSample: expect.any(Boolean) })
  const unread = await adminFetch(server.baseUrl, auth, '/venues/map-location', { method: 'POST', body: JSON.stringify({ url: 'https://example.com/x' }) })
  expect(unread.status).toBe(422); expect(await unread.json()).toMatchObject({ error: { code: 'MAP_LINK_UNREADABLE' } })
  const longLink = await adminFetch(server.baseUrl, auth, '/venues/map-location', { method: 'POST', body: JSON.stringify({ url: 'https://www.google.com/maps/@-7.57,110.81,15z' }) })
  expect(await longLink.json()).toEqual({ mapUrl: 'https://www.google.com/maps/@-7.57,110.81,15z', latitude: -7.57, longitude: 110.81 })
})
