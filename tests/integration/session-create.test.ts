import { randomUUID } from 'node:crypto'
import { beforeAll, beforeEach, afterAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { createSession } from '../../server/features/admin/sessions/session-create.service.ts'
import { getOccupiedPlaceCounts } from '../../server/features/capacity/occupancy.ts'
import { clubToday, addClubDays } from '../../shared/club-time.ts'
import type { SessionInput, CreateSessionResponse } from '../../shared/api/admin-sessions.ts'
import type { PublicScheduleResponse } from '../../shared/api/public.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { createSampleCatalog } from '../support/fixtures.ts'
import { startTestServer } from '../support/test-server.ts'
import { provisionTestAdmin, signInAs, adminFetch } from '../support/admin-fixtures.ts'
let db: Awaited<ReturnType<typeof createTestDatabase>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
let server: Awaited<ReturnType<typeof startTestServer>>
let auth: Awaited<ReturnType<typeof signInAs>>
let adminId: string
beforeAll(async () => {
  db = await createTestDatabase(); catalog = await createSampleCatalog(db.prisma)
  const credentials = await provisionTestAdmin(db.prisma)
  adminId = (await db.prisma.adminAccount.findUniqueOrThrow({ where: { email: credentials.email } })).id
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' }))
  auth = await signInAs(server.baseUrl, credentials)
})
beforeEach(async () => { await db.prisma.classSession.deleteMany() })
afterAll(async () => { await server?.close(); await db?.cleanup() })
function input(overrides: Partial<SessionInput> = {}): SessionInput {
  return { createRequestId: randomUUID(), classId: catalog.tennisClass.id, levelId: catalog.level.id, venueId: catalog.venue.id, coachIds: catalog.coaches.map(coach => coach.id), date: addClubDays(clubToday(), 7), startTime: '18:00', durationMinutes: 90, priceIdr: 150001, minParticipants: 4, maxParticipants: 8, ...overrides }
}
const publish = (body: unknown) => adminFetch(server.baseUrl, auth, '/sessions', { method: 'POST', body: JSON.stringify(body) })
test('idempotent replay returns the original session before checking changed field values', async () => {
  const body = input(), first = await publish(body)
  expect(first.status).toBe(201)
  const saved = await first.json() as CreateSessionResponse
  const second = await publish({ ...body, priceIdr: -1 })
  expect(second.status).toBe(200)
  const replay = await second.json() as CreateSessionResponse
  expect(replay.replayed).toBe(true); expect(replay.session).toEqual(saved.session)
  expect(await db.prisma.classSession.count()).toBe(1)
})
test('concurrency with one createRequestId writes exactly one session and returns the same id', async () => {
  const body = input()
  const responses = await Promise.all([publish(body), publish(body)])
  expect(responses.map(response => response.status).sort()).toEqual([200, 201])
  const results = await Promise.all(responses.map(response => response.json() as Promise<CreateSessionResponse>))
  expect(results[0].session.id).toBe(results[1].session.id)
  expect(await db.prisma.classSession.count({ where: { createRequestId: body.createRequestId } })).toBe(1)
})
test('missing-reference cases report all fields and leave no session or coach links', async () => {
  const response = await publish(input({ classId: 'missing', levelId: 'missing', venueId: 'missing', coachIds: ['missing'] }))
  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: { code: 'VALIDATION_FAILED', fields: { classId: 'REFERENCE_NOT_FOUND', levelId: 'REFERENCE_NOT_FOUND', venueId: 'REFERENCE_NOT_FOUND', coachIds: 'REFERENCE_NOT_FOUND' } } })
  expect(await db.prisma.classSession.count()).toBe(0); expect(await db.prisma.sessionCoach.count()).toBe(0)
})
test('invalid input reports every field with precise codes, rejects unknown keys and writes nothing', async () => {
  const response = await publish({ ...input(), minParticipants: null, maxParticipants: 501, durationMinutes: '8', priceIdr: 4.5, coachIds: [] })
  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: { code: 'VALIDATION_FAILED', fields: { minParticipants: 'REQUIRED', maxParticipants: 'OUT_OF_RANGE', durationMinutes: 'INVALID_INTEGER', priceIdr: 'INVALID_INTEGER', coachIds: 'COACH_REQUIRED' } } })
  expect((await publish({ ...input(), unapproved: true })).status).toBe(400)
  expect(await db.prisma.classSession.count()).toBe(0)
})
test('duplicates and absent min/max/venue are rejected without coercion or writes', async () => {
  for (const fields of [{ coachIds: [catalog.coaches[0].id, catalog.coaches[0].id] }, { minParticipants: undefined }, { maxParticipants: null }, { venueId: undefined }, { priceIdr: '8' }, { durationMinutes: 1e21 }]) {
    expect((await publish({ ...input(), ...fields })).status).toBe(400)
    expect(await db.prisma.classSession.count()).toBe(0)
  }
})
test('rollback after ClassSession insert and before coach writing leaves no session rows', async () => {
  await expect(createSession(db.prisma, input(), adminId, new Date(), getOccupiedPlaceCounts, async () => { throw new Error('Forced coach write failure') })).rejects.toThrow('Forced coach write failure')
  expect(await db.prisma.classSession.count()).toBe(0); expect(await db.prisma.sessionCoach.count()).toBe(0)
})
test('ordered coaches and exact price are persisted and returned to signed-out schedule reads', async () => {
  const body = input({ coachIds: [...catalog.coaches].reverse().map(coach => coach.id), minParticipants: 8, maxParticipants: 8 })
  const response = await publish(body)
  expect(response.status).toBe(201)
  const result = await response.json() as CreateSessionResponse
  expect(result.session.coaches.map(coach => coach.id)).toEqual(body.coachIds)
  expect((await db.prisma.sessionCoach.findMany({ where: { sessionId: result.session.id }, orderBy: { position: 'asc' } })).map(row => ({ coachId: row.coachId, position: row.position }))).toEqual(body.coachIds.map((coachId, position) => ({ coachId, position })))
  expect((await db.prisma.classSession.findUniqueOrThrow({ where: { id: result.session.id } })).priceIdr).toBe(body.priceIdr)
  const schedule = await (await fetch(server.baseUrl + '/api/public/schedule?date=' + body.date)).json() as PublicScheduleResponse
  expect(schedule.sessions.find(row => row.id === result.session.id)?.priceIdr).toBe(body.priceIdr)
})
