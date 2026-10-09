import { randomUUID } from 'node:crypto'
import { beforeAll, afterAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { provisionTestAdmin, signInAs, adminFetch } from '../support/admin-fixtures.ts'
import { createSampleCatalog } from '../support/fixtures.ts'
import { createSession } from '../../server/features/admin/sessions/session-create.service.ts'
import { saveClass } from '../../server/features/admin/classes/class.service.ts'
import { clubToday, addClubDays } from '../../shared/club-time.ts'
import type { ClassInput } from '../../shared/api/admin-classes.ts'
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let auth: Awaited<ReturnType<typeof signInAs>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
beforeAll(async () => { db = await createTestDatabase(); catalog = await createSampleCatalog(db.prisma); server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' })); auth = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma)) })
afterAll(async () => { await server?.close(); await db?.cleanup() })
const input = (): ClassInput => ({ name: 'Test class ' + randomUUID(), createRequestId: randomUUID(), defaultLevelId: catalog.level.id, defaultVenueId: catalog.venue.id, defaultDurationMinutes: 90, defaultPriceIdr: 150000, defaultMinParticipants: 2, defaultMaxParticipants: 8, defaultCoachIds: catalog.coaches.map(row => row.id) })
test('class routes enforce auth/CSRF and replay creates; defaults update leaves published session byte-for-byte unchanged', async () => {
  const body = input()
  expect((await fetch(server.baseUrl + '/api/admin/classes')).status).toBe(401)
  expect((await adminFetch(server.baseUrl, auth, '/classes', { method: 'POST', body: JSON.stringify(body), headers: { 'X-CSRF-Token': '' } })).status).toBe(403)
  const create = () => adminFetch(server.baseUrl, auth, '/classes', { method: 'POST', body: JSON.stringify(body) })
  const response = await create(); expect(response.status).toBe(200)
  const row = await response.json(); expect(row.defaultCoachIds).toEqual(body.defaultCoachIds)
  expect(await (await create()).json()).toMatchObject({ id: row.id })
  const admin = await db.prisma.adminAccount.findUniqueOrThrow({ where: { email: auth.info.admin.email } })
  const published = await createSession(db.prisma, { createRequestId: randomUUID(), classId: row.id, date: addClubDays(clubToday(), 15), startTime: '12:00', levelId: body.defaultLevelId, venueId: body.defaultVenueId, coachIds: body.defaultCoachIds, durationMinutes: 90, priceIdr: 150000, minParticipants: 2, maxParticipants: 8 }, admin.id)
  const before = await db.prisma.classSession.findUniqueOrThrow({ where: { id: published.session.id }, include: { coaches: { orderBy: { position: 'asc' } } } })
  const { createRequestId: omitted, ...update } = body; void omitted
  const updated = await adminFetch(server.baseUrl, auth, `/classes/${row.id}`, { method: 'PUT', body: JSON.stringify({ ...update, defaultPriceIdr: 170000, defaultMaxParticipants: 12, defaultCoachIds: [...body.defaultCoachIds].reverse(), version: 1 }) })
  expect(await updated.json()).toMatchObject({ version: 2, defaultPriceIdr: 170000, defaultCoachIds: [...body.defaultCoachIds].reverse() })
  expect(await db.prisma.classSession.findUniqueOrThrow({ where: { id: published.session.id }, include: { coaches: { orderBy: { position: 'asc' } } } })).toEqual(before)
  const stale = await adminFetch(server.baseUrl, auth, `/classes/${row.id}`, { method: 'PUT', body: JSON.stringify({ ...update, version: 1 }) })
  expect(stale.status).toBe(409)
  const detail = await (await fetch(server.baseUrl + `/api/public/sessions/${published.session.id}`)).json()
  expect(detail).toMatchObject({ priceIdr: 150000, maxParticipants: 8, coaches: catalog.coaches.map(row => row.name), isSample: true })
})
test('class validation rejects missing references, duplicated coaches, minimum above maximum, and normalized duplicate names', async () => {
  for (const [patch, field, code] of [
    [{ defaultVenueId: 'missing' }, 'defaultVenueId', 'REFERENCE_NOT_FOUND'],
    [{ defaultCoachIds: [catalog.coaches[0].id, catalog.coaches[0].id] }, 'defaultCoachIds', 'COACH_DUPLICATE'],
    [{ defaultMinParticipants: 9 }, 'defaultMinParticipants', 'MIN_EXCEEDS_MAX'],
  ] as const) {
    const response = await adminFetch(server.baseUrl, auth, '/classes', { method: 'POST', body: JSON.stringify({ ...input(), ...patch }) })
    expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ error: { fields: { [field]: code } } })
  }
  const body = input(); await saveClass(db.prisma, body)
  await expect(saveClass(db.prisma, { ...body, createRequestId: randomUUID(), name: ' ' + body.name.toUpperCase() + ' ' })).rejects.toMatchObject({ code: 'DUPLICATE_NAME' })
})
test('class updates roll back fields and coach replacement together; competing version writes have one winner', async () => {
  const body = input(); const row = await saveClass(db.prisma, body)
  const update = { ...body, defaultPriceIdr: 170000, version: 1 }
  await expect(saveClass(db.prisma, update, row.id, async () => { throw new Error('Injected coach failure') })).rejects.toThrow('Injected coach failure')
  expect(await db.prisma.tennisClass.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ version: 1, defaultPriceIdr: body.defaultPriceIdr })
  expect(await db.prisma.classDefaultCoach.count({ where: { classId: row.id } })).toBe(2)
  const writes = await Promise.allSettled([saveClass(db.prisma, update, row.id), saveClass(db.prisma, { ...update, defaultPriceIdr: 180000 }, row.id)])
  expect(writes.filter(result => result.status === 'fulfilled')).toHaveLength(1)
  expect(writes.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'STALE_VERSION' } })
})
