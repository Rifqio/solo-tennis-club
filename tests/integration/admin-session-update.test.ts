import { beforeAll, afterAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { provisionTestAdmin, signInAs, adminFetch } from '../support/admin-fixtures.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { updateSession } from '../../server/features/admin/sessions/session-update.service.ts'
import { getAdminSession } from '../../server/features/admin/sessions/session-detail.service.ts'
import { clubToday, addClubDays, clubDateTimeToInstant } from '../../shared/club-time.ts'
import type { UpdateSessionInput } from '../../shared/api/admin-sessions.ts'
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let auth: Awaited<ReturnType<typeof signInAs>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
let adminId: string
beforeAll(async () => { db = await createTestDatabase(); catalog = await createSampleCatalog(db.prisma); server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' })); auth = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma)); adminId = (await db.prisma.adminAccount.findUniqueOrThrow({ where: { email: auth.info.admin.email } })).id })
afterAll(async () => { await server?.close(); await db?.cleanup() })
const body = (): UpdateSessionInput => ({ version: 1, classId: catalog.tennisClass.id, date: addClubDays(clubToday(), 20), startTime: '18:00', durationMinutes: 90, levelId: catalog.level.id, venueId: catalog.venue.id, coachIds: catalog.coaches.map(row => row.id), priceIdr: 150000, minParticipants: 2, maxParticipants: 8 })
const sample = () => createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(body().date, body().startTime), status: 'cancelled' })
test('session edit auth, strict input, atomic ordered-coach replacement, stale version and unchanged status', async () => {
  const row = await sample()
  expect((await fetch(server.baseUrl + `/api/admin/sessions/${row.id}`)).status).toBe(401)
  expect((await adminFetch(server.baseUrl, auth, `/sessions/${row.id}`, { method: 'PUT', body: JSON.stringify(body()), headers: { 'X-CSRF-Token': '' } })).status).toBe(403)
  const result = await adminFetch(server.baseUrl, auth, `/sessions/${row.id}`, { method: 'PUT', body: JSON.stringify({ ...body(), priceIdr: 175000, coachIds: [...body().coachIds].reverse() }) })
  expect(result.status).toBe(200); expect(await result.json()).toMatchObject({ version: 2, priceIdr: 175000, status: 'cancelled', coaches: [...catalog.coaches].reverse().map(coach => ({ id: coach.id, name: coach.name })) })
  const stale = await adminFetch(server.baseUrl, auth, `/sessions/${row.id}`, { method: 'PUT', body: JSON.stringify(body()) })
  expect(stale.status).toBe(409); expect(await stale.json()).toMatchObject({ error: { code: 'STALE_VERSION', latest: { version: 2, priceIdr: 175000 } } })
  expect((await adminFetch(server.baseUrl, auth, `/sessions/${row.id}`, { method: 'PUT', body: JSON.stringify({ ...body(), version: 2, status: 'scheduled' }) })).status).toBe(400)
})
test('capacity is counted inside the transaction: 4 is rejected at occupancy 5 and 5 accepted', async () => {
  const row = await sample()
  const occupancy = async (tx: unknown, ids: string[]) => { expect(tx).not.toBe(db.prisma); expect(ids).toEqual([row.id]); return new Map([[row.id, 5]]) }
  await expect(updateSession(db.prisma, row.id, { ...body(), maxParticipants: 4 }, adminId, new Date(), occupancy)).rejects.toMatchObject({ fields: { maxParticipants: 'CAPACITY_BELOW_OCCUPIED' } })
  expect(await getAdminSession(db.prisma, row.id)).toMatchObject({ version: 1, maxParticipants: 8 })
  expect(await updateSession(db.prisma, row.id, { ...body(), maxParticipants: 5 }, adminId, new Date(), occupancy)).toMatchObject({ maxParticipants: 5, remainingPlaces: 0, version: 2 })
})
test('past sessions allow unchanged time; moving to a past time is rejected; failed coach write rolls everything back', async () => {
  const past = addClubDays(clubToday(), -1)
  const row = await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(past, '18:00') })
  expect(await updateSession(db.prisma, row.id, { ...body(), date: past }, adminId)).toMatchObject({ version: 2, date: past })
  await expect(updateSession(db.prisma, row.id, { ...body(), date: past, startTime: '17:00', version: 2 }, adminId)).rejects.toMatchObject({ fields: { date: 'DATE_IN_PAST' } })
  const before = await getAdminSession(db.prisma, row.id)
  await expect(updateSession(db.prisma, row.id, { ...body(), date: past, version: 2, priceIdr: 100000 }, adminId, new Date(), undefined, async () => { throw new Error('Injected failure') })).rejects.toThrow('Injected failure')
  expect(await getAdminSession(db.prisma, row.id)).toEqual(before)
})
test('two same-version session edits have one winner; invalid limits and missing references never commit', async () => {
  const row = await sample()
  await expect(updateSession(db.prisma, row.id, { ...body(), minParticipants: 9 }, adminId)).rejects.toMatchObject({ fields: { minParticipants: 'MIN_EXCEEDS_MAX' } })
  await expect(updateSession(db.prisma, row.id, { ...body(), venueId: 'missing' }, adminId)).rejects.toMatchObject({ fields: { venueId: 'REFERENCE_NOT_FOUND' } })
  const writes = await Promise.allSettled([updateSession(db.prisma, row.id, { ...body(), priceIdr: 170000 }, adminId), updateSession(db.prisma, row.id, { ...body(), priceIdr: 180000 }, adminId)])
  expect(writes.filter(result => result.status === 'fulfilled')).toHaveLength(1)
  expect(writes.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'STALE_VERSION' } })
  expect(await getAdminSession(db.prisma, row.id)).toMatchObject({ version: 2, status: 'cancelled' })
})
