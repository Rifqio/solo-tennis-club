import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { listAdminSessions } from '../../server/features/admin/sessions/session-list.service.ts'
import { addClubDays, clubDateTimeToInstant, clubToday } from '../../shared/club-time.ts'
import type { AdminSessionListResponse } from '../../shared/api/admin-sessions.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { provisionTestAdmin, signInAs, adminFetch } from '../support/admin-fixtures.ts'

let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let auth: Awaited<ReturnType<typeof signInAs>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
const today = clubToday()
beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' }))
  auth = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma))
  await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(addClubDays(today, -1), '23:59') })
  await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(today, '00:00') })
  const upcoming = await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(addClubDays(today, 2), '18:00'), status: 'cancelled' })
  await db.prisma.sessionCoach.deleteMany({ where: { sessionId: upcoming.id } })
  await db.prisma.sessionCoach.createMany({ data: [...catalog.coaches].reverse().map((coach, position) => ({ sessionId: upcoming.id, coachId: coach.id, position })) })
})
afterAll(async () => { await server?.close(); await db?.cleanup() })

test('protected list refuses anonymous and forged sessions without leaking records', async () => {
  for (const headers of [{}, { Cookie: 'lafu_admin_session=forged' }] as Record<string, string>[]) {
    const response = await fetch(server.baseUrl + '/api/admin/sessions', { headers })
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: { code: 'UNAUTHENTICATED' } })
  }
})
test('upcoming list includes WIB midnight, excludes yesterday, sorts time and retains cancelled/sample records', async () => {
  const response = await adminFetch(server.baseUrl, auth, '/sessions')
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('no-store')
  const body = await response.json() as AdminSessionListResponse
  expect(body.sessions.map(row => row.date)).toEqual([today, addClubDays(today, 2)])
  expect(body.sessions[0].startTime).toBe('00:00')
  expect(body.sessions[1].coaches.map(row => row.name)).toEqual([...catalog.coaches].reverse().map(row => row.name))
  expect(body.sessions[1].status).toBe('cancelled')
  expect(body.sessions.every(row => row.isSample && row.remainingPlaces === row.maxParticipants)).toBe(true)
  const encoded = JSON.stringify(body)
  for (const privateField of ['passwordHash', 'csrfToken', 'tokenHash', 'createdById', 'updatedById']) expect(encoded).not.toContain(privateField)
})
test('dated list distinguishes empty dates, finds the next date, and validates malformed/out-of-window queries', async () => {
  const response = await adminFetch(server.baseUrl, auth, '/sessions?date=' + addClubDays(today, 1))
  const body = await response.json() as AdminSessionListResponse
  expect(body.sessions).toEqual([])
  expect(body.nextDate).toBe(addClubDays(today, 2))
  for (const [query, code] of [
    ['date=2026-02-30', 'INVALID_DATE'], ['date=x', 'INVALID_DATE'], ['date=x&date=y', 'INVALID_DATE'],
    ['date=' + addClubDays(today, -1), 'DATE_OUT_OF_RANGE'], ['date=' + addClubDays(today, 366), 'DATE_OUT_OF_RANGE'],
  ]) {
    const invalid = await adminFetch(server.baseUrl, auth, '/sessions?' + query)
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toEqual({ error: { code } })
  }
})
test('bounded lists explicitly report truncation rather than silently implying completeness', async () => {
  const date = addClubDays(today, 3)
  await db.prisma.classSession.createMany({ data: Array.from({ length: 201 }, (_, i) => ({
    id: `bounded-${i.toString().padStart(3, '0')}`, classId: catalog.tennisClass.id, levelId: catalog.level.id, venueId: catalog.venue.id,
    startsAt: clubDateTimeToInstant(date, '18:00'), durationMinutes: 90, priceIdr: 100000, minParticipants: 1, maxParticipants: 8,
  })) })
  const result = await listAdminSessions(db.prisma, new Date(), date)
  expect(result.sessions).toHaveLength(200)
  expect(result.truncated).toBe(true)
  expect(result.sessions[0].id).toBe('bounded-000')
  expect(result.sessions[199].id).toBe('bounded-199')
})
test('revocation removes access to the read endpoint', async () => {
  const other = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma))
  expect((await adminFetch(server.baseUrl, other, '/auth/sign-out', { method: 'POST', body: '{}' })).status).toBe(204)
  expect((await adminFetch(server.baseUrl, other, '/sessions')).status).toBe(401)
})
