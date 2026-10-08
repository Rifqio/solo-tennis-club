import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'
import { beforeAll, afterAll, expect, test } from 'vitest'
import { createTestDatabase } from '../support/test-db.ts'
import { createSampleCatalog } from '../support/fixtures.ts'
import { provisionTestAdmin, signInAs, adminFetch } from '../support/admin-fixtures.ts'
import { projectRoot } from '../../server/config/database-file.ts'
import { clubToday, addClubDays } from '../../shared/club-time.ts'
import type { CreateSessionResponse, SessionOptions } from '../../shared/api/admin-sessions.ts'
import type { PublicScheduleResponse } from '../../shared/api/public.ts'
let db: Awaited<ReturnType<typeof createTestDatabase>>
let credentials: Awaited<ReturnType<typeof provisionTestAdmin>>
let child: ChildProcess | undefined
beforeAll(async () => { db = await createTestDatabase(); await createSampleCatalog(db.prisma); credentials = await provisionTestAdmin(db.prisma) })
async function stop() {
  if (!child || child.exitCode !== null || child.signalCode !== null) { child = undefined; return }
  const exited = once(child, 'exit'); child.kill(); await exited; child = undefined
}
afterAll(async () => { await stop(); await db?.cleanup() })
async function launch(port: number) {
  const url = `http://127.0.0.1:${port}`
  let output = ''
  child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], { cwd: projectRoot, env: { ...process.env, LAFU_DATABASE_FILE: db.databaseFile, LAFU_HOST: '127.0.0.1', LAFU_PORT: String(port), LAFU_COOKIE_SECURE: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout?.on('data', chunk => { output += String(chunk) })
  child.stderr?.on('data', chunk => { output += String(chunk) })
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) throw new Error('Server exited: ' + output)
    try { if ((await fetch(url + '/api/public/schedule?date=' + clubToday(), { signal: AbortSignal.timeout(1000) })).ok) return url } catch { /* Await listener startup. */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('Server startup timed out: ' + output)
}
test('admin publishes for signed-out visitors and both publication and cookie session survive a process restart', async () => {
  const listener = createServer()
  await new Promise<void>(resolve => listener.listen(0, '127.0.0.1', resolve))
  const address = listener.address()
  if (!address || typeof address === 'string') throw new Error('Missing port')
  await new Promise<void>((resolve, reject) => listener.close(error => error ? reject(error) : resolve()))
  const url = await launch(address.port)
  const auth = await signInAs(url, credentials)
  const optionsResponse = await adminFetch(url, auth, '/session-options')
  const options = await optionsResponse.json() as SessionOptions
  const date = addClubDays(clubToday(), 7)
  const response = await adminFetch(url, auth, '/sessions', { method: 'POST', body: JSON.stringify({ createRequestId: randomUUID(), classId: options.classes[0].id, date, startTime: '19:30', ...options.classes[0].defaults }) })
  expect(response.status).toBe(201)
  const result = await response.json() as CreateSessionResponse
  expect(result.session.coaches.map(coach => coach.id)).toEqual(options.classes[0].defaults.coachIds)
  expect(result.session.remainingPlaces).toBe(result.session.maxParticipants)
  expect(await db.prisma.classSession.findUniqueOrThrow({ where: { id: result.session.id } })).toMatchObject({ createdById: expect.any(String), updatedById: expect.any(String) })
  for (let run = 0; run < 2; run++) {
    const publicResponse = await fetch(url + '/api/public/schedule?date=' + date)
    const schedule = await publicResponse.json() as PublicScheduleResponse
    expect(schedule.sessions.find(row => row.id === result.session.id)).toMatchObject({ startTime: '19:30', priceIdr: result.session.priceIdr })
    expect((await adminFetch(url, auth, '/auth/session')).status).toBe(200)
    expect((await fetch(url + '/api/admin/session-options')).status).toBe(401)
    if (run === 0) { await stop(); await expect(fetch(url, { signal: AbortSignal.timeout(1000) })).rejects.toThrow(); await launch(address.port) }
  }
})
