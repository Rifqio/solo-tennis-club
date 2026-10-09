import { beforeAll, afterAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
beforeAll(async () => { db = await createTestDatabase(); server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' })) })
afterAll(async () => { await server?.close(); await db?.cleanup() })
test('public detail has an exact allowlist, stored coach order and integer capacity/price', async () => {
  const catalog = await createSampleCatalog(db.prisma); const row = await createSampleSession(db.prisma, { catalog })
  await db.prisma.sessionCoach.deleteMany({ where: { sessionId: row.id } })
  await db.prisma.sessionCoach.createMany({ data: [{ sessionId: row.id, coachId: catalog.coaches[0].id, position: 1 }, { sessionId: row.id, coachId: catalog.coaches[1].id, position: 0 }] })
  const response = await fetch(server.baseUrl + `/api/public/sessions/${row.id}`)
  expect(response.headers.get('cache-control')).toBe('no-store')
  const detail = await response.json()
  expect(Object.keys(detail).sort()).toEqual(['id','startsAt','endsAt','date','startTime','endTime','className','levelName','venueName','venueAddress','priceIdr','remainingPlaces','availability','isSample','coaches','minParticipants','maxParticipants','durationMinutes','version'].sort())
  expect(detail).toMatchObject({ coaches: [...catalog.coaches].reverse().map(coach => coach.name), priceIdr: 150000, minParticipants: 4, maxParticipants: 8, remainingPlaces: 8, availability: 'available' })
})
test('unknown and malformed detail ids return 404 without exposing private data', async () => {
  for (const id of ['unknown', 'UPPERCASE', 'x'.repeat(65), '%3Cscript%3E']) {
    const response = await fetch(server.baseUrl + '/api/public/sessions/' + id)
    expect(response.status).toBe(404); expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND' } })
  }
})
test('a session using sample references remains visibly sample data even when its own flag is false', async () => {
  const catalog = await createSampleCatalog(db.prisma)
  const row = await createSampleSession(db.prisma, { catalog })
  await db.prisma.classSession.update({ where: { id: row.id }, data: { isSample: false } })
  expect(await (await fetch(server.baseUrl + `/api/public/sessions/${row.id}`)).json()).toMatchObject({ isSample: true })
})
