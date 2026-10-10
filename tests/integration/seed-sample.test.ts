import { spawnSync } from 'node:child_process'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { projectRoot } from '../../server/config/database-file.ts'
import { SAMPLE_COACH_COUNT, SAMPLE_SESSION_COUNT, seedSampleCoaches, seedSampleData } from '../../server/ops/sample-data.ts'
import { addClubDays, clubDateTimeToInstant, clubToday } from '../../shared/club-time.ts'
import type { PublicScheduleResponse } from '../../shared/api/public.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'

let db: Awaited<ReturnType<typeof createTestDatabase>>
beforeAll(async () => { db = await createTestDatabase() })
afterAll(async () => { await db?.cleanup() })

async function counts() {
  const [levels, venues, coaches, classes, sessions] = await Promise.all([
    db.prisma.level.count(), db.prisma.venue.count(), db.prisma.coach.count(), db.prisma.tennisClass.count(), db.prisma.classSession.count(),
  ])
  return { levels, venues, coaches, classes, sessions }
}

test('first run creates labeled sample records only; a second run changes nothing', async () => {
  expect(await seedSampleData(db.prisma)).toBe('created')
  const first = await counts()
  expect(first).toEqual({ levels: 2, venues: 2, coaches: 3, classes: 3, sessions: SAMPLE_SESSION_COUNT })
  for (const model of [db.prisma.level, db.prisma.venue, db.prisma.coach, db.prisma.tennisClass, db.prisma.classSession] as const) {
    expect(await (model as typeof db.prisma.level).count({ where: { isSample: false } })).toBe(0)
  }
  expect((await db.prisma.tennisClass.findMany()).every(item => item.name.startsWith('Contoh'))).toBe(true)
  expect(await db.prisma.classSession.count({ where: { status: 'cancelled' } })).toBe(2)
  expect(await db.prisma.classSession.count({ where: { maxParticipants: 7 } })).toBeGreaterThan(0)
  expect(await db.prisma.sessionCoach.groupBy({ by: ['sessionId'], having: { sessionId: { _count: { gt: 1 } } } })).not.toHaveLength(0)

  expect(await seedSampleData(db.prisma)).toBe('skipped')
  expect(await counts()).toEqual(first)
})

test('refresh re-dates sample sessions from a new today without duplicating the catalog', async () => {
  const later = clubDateTimeToInstant(addClubDays(clubToday(), 20), '09:00')
  expect(await seedSampleData(db.prisma, { now: later, refresh: true })).toBe('refreshed')
  const after = await counts()
  expect(after).toEqual({ levels: 2, venues: 2, coaches: 3, classes: 3, sessions: SAMPLE_SESSION_COUNT })
  const earliest = await db.prisma.classSession.findFirstOrThrow({ orderBy: { startsAt: 'asc' } })
  expect(earliest.startsAt.getTime()).toBeGreaterThanOrEqual(clubDateTimeToInstant(addClubDays(clubToday(), 20), '00:00').getTime())
  // Put the sessions back on today's dates for the public check below.
  await seedSampleData(db.prisma, { refresh: true })
})

test('the public schedule marks seeded sessions as sample data', async () => {
  const server = await startTestServer(createApp({ prisma: db.prisma }))
  try {
    const body = await (await fetch(server.baseUrl + '/api/public/schedule?date=' + clubToday())).json() as PublicScheduleResponse
    expect(body.sessions.length).toBeGreaterThan(0)
    expect(body.sessions.every(session => session.isSample && session.className.startsWith('Contoh'))).toBe(true)
  } finally { await server.close() }
})

test('sample coaches are added once with portraits, and an existing photo is never overwritten', async () => {
  await seedSampleData(db.prisma)
  expect(await seedSampleCoaches(db.prisma)).toBe(10)
  expect(await db.prisma.coach.count({ where: { isSample: true } })).toBe(SAMPLE_COACH_COUNT)
  expect(await db.prisma.coach.count({ where: { isSample: true, photoUrl: { not: null } } })).toBe(8)
  await db.prisma.coach.update({ where: { nameKey: 'contoh budi santoso' }, data: { photoUrl: '/photos/coaches/own.webp' } })
  expect(await seedSampleCoaches(db.prisma)).toBe(0)
  expect((await db.prisma.coach.findUnique({ where: { nameKey: 'contoh budi santoso' } }))?.photoUrl).toBe('/photos/coaches/own.webp')
})

test('the seed command refuses to run in production and writes nothing', async () => {
  const before = await counts()
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/seed-sample.ts'], {
    cwd: projectRoot, env: { ...process.env, NODE_ENV: 'production', LAFU_DATABASE_FILE: db.databaseFile }, encoding: 'utf8', timeout: 30000,
  })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('production')
  expect(await counts()).toEqual(before)
})
