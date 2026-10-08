import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createPrismaClient, initializeDatabase } from '../../server/db.ts'
import { projectRoot } from '../../server/config/database-file.ts'
import { getPublicSchedule } from '../../server/features/public/schedule.service.ts'
import { clubDateTimeToInstant } from '../../shared/club-time.ts'
import type { PublicScheduleResponse } from '../../shared/api/public.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'

let db: Awaited<ReturnType<typeof createTestDatabase>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
let child: ChildProcess | undefined
beforeAll(async () => { db = await createTestDatabase(); catalog = await createSampleCatalog(db.prisma) })
async function stopChild() {
  if (!child || child.exitCode !== null || child.signalCode !== null) { child = undefined; return }
  const processToStop = child
  const exited = once(processToStop, 'exit')
  processToStop.kill()
  await exited
  child = undefined
}
afterAll(async () => { await stopChild(); await db?.cleanup() })

test('clean-file migration deploy enables WAL, 5000ms busy timeout and foreign keys', async () => {
  const journal = await db.prisma.$queryRawUnsafe<Array<{ journal_mode: string }>>('PRAGMA journal_mode')
  const timeout = await db.prisma.$queryRawUnsafe<Array<{ timeout: number | bigint }>>('PRAGMA busy_timeout')
  const keys = await db.prisma.$queryRawUnsafe<Array<{ foreign_keys: number | bigint }>>('PRAGMA foreign_keys')
  expect(journal[0].journal_mode).toBe('wal')
  expect(Number(timeout[0].timeout)).toBe(5000)
  expect(Number(keys[0].foreign_keys)).toBe(1)
})

test('WIB boundary instants round-trip exactly and appear only within their half-open club date', async () => {
  const dates = ['2026-12-30', '2026-12-31', '2027-01-01']
  const records = []
  for (const date of dates) {
    for (const time of ['00:00', '23:30', '23:59']) {
      const startsAt = clubDateTimeToInstant(date, time)
      const record = await createSampleSession(db.prisma, { catalog, startsAt })
      const reopened = await db.prisma.classSession.findUniqueOrThrow({ where: { id: record.id } })
      expect(reopened.startsAt.getTime()).toBe(startsAt.getTime())
      records.push({ id: record.id, date, time })
    }
  }
  for (const date of dates) {
    const result = await getPublicSchedule(db.prisma, date)
    expect(result.sessions.map(row => row.id)).toEqual(records.filter(row => row.date === date).map(row => row.id))
    expect(result.sessions.map(row => row.startTime)).toEqual(['00:00', '23:30', '23:59'])
  }
  expect((await getPublicSchedule(db.prisma, '2026-12-29')).sessions).toEqual([])
  expect((await getPublicSchedule(db.prisma, '2027-01-02')).sessions).toEqual([])
})

test('client reopen preserves a session on the same SQLite file', async () => {
  const sample = await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant('2027-02-03', '18:00') })
  await db.prisma.$disconnect()
  const reopened = createPrismaClient(db.databaseFile)
  try {
    await initializeDatabase(reopened)
    expect((await reopened.classSession.findUniqueOrThrow({ where: { id: sample.id } })).startsAt.getTime()).toBe(sample.startsAt.getTime())
  } finally { await reopened.$disconnect() }
})

test('process restart serves persisted sessions through the public API', async () => {
  const sample = await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant('2027-03-04', '18:00') })
  const listener = createServer()
  await new Promise<void>(resolveListen => listener.listen(0, '127.0.0.1', resolveListen))
  const address = listener.address()
  if (!address || typeof address === 'string') throw new Error('Missing free port')
  const port = address.port
  await new Promise<void>((resolveClose, reject) => listener.close(error => error ? reject(error) : resolveClose()))
  const url = 'http://127.0.0.1:' + port + '/api/public/schedule?date=2027-03-04'
  for (let run = 0; run < 2; run++) {
    let output = ''
    child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
      cwd: projectRoot, env: { ...process.env, LAFU_DATABASE_FILE: db.databaseFile, LAFU_PORT: String(port), LAFU_HOST: '127.0.0.1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    child.stdout?.on('data', data => { output += String(data) })
    child.stderr?.on('data', data => { output += String(data) })
    let response: Response | undefined
    for (let attempt = 0; attempt < 80; attempt++) {
      if (child.exitCode !== null) throw new Error('Server exited: ' + output)
      try { const candidate = await fetch(url, { signal: AbortSignal.timeout(1000) }); if (candidate.ok) { response = candidate; break } } catch { /* Wait for the child listener. */ }
      await new Promise(resolveWait => setTimeout(resolveWait, 100))
    }
    if (!response) throw new Error('Server did not become ready: ' + output)
    const body = await response.json() as PublicScheduleResponse
    expect(body.sessions.map(row => row.id)).toContain(sample.id)
    await stopChild()
    await expect(fetch(url, { signal: AbortSignal.timeout(1000) })).rejects.toThrow()
  }
})

test('restricted coach deletion leaves the session and coach links intact', async () => {
  const sample = await createSampleSession(db.prisma, { catalog })
  await expect(db.prisma.coach.delete({ where: { id: catalog.coaches[0].id } })).rejects.toThrow()
  expect(await db.prisma.classSession.findUnique({ where: { id: sample.id } })).not.toBeNull()
  expect(await db.prisma.sessionCoach.count({ where: { sessionId: sample.id } })).toBe(2)
})
