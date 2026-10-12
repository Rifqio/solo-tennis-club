import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { mkdirSync, rmSync, truncateSync, writeFileSync, copyFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { projectRoot } from '../../server/config/database-file.ts'
import { backupDatabase, restoreDatabase, verifyBackup } from '../../server/ops/backup.ts'
import { addClubDays, clubToday } from '../../shared/club-time.ts'
import type { CreateSessionResponse, SessionOptions } from '../../shared/api/admin-sessions.ts'
import type { PublicScheduleResponse } from '../../shared/api/public.ts'
import { adminFetch, provisionTestAdmin, signInAs } from '../support/admin-fixtures.ts'
import { createSampleCatalog } from '../support/fixtures.ts'
import { createTestDatabase } from '../support/test-db.ts'

const workDir = resolve(tmpdir(), 'stc-tests', 'backup-' + randomUUID())
let db: Awaited<ReturnType<typeof createTestDatabase>>
let credentials: Awaited<ReturnType<typeof provisionTestAdmin>>
const children: ChildProcess[] = []

beforeAll(async () => {
  mkdirSync(workDir, { recursive: true })
  db = await createTestDatabase()
  await createSampleCatalog(db.prisma)
  credentials = await provisionTestAdmin(db.prisma)
})
afterAll(async () => {
  for (const child of children) if (child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill(); await exited }
  await db?.cleanup()
  rmSync(workDir, { recursive: true, force: true })
})

async function freePort() {
  const listener = createServer()
  await new Promise<void>(done => listener.listen(0, '127.0.0.1', done))
  const address = listener.address()
  if (!address || typeof address === 'string') throw new Error('Missing port')
  await new Promise<void>((done, reject) => listener.close(error => error ? reject(error) : done()))
  return address.port
}

async function launch(databaseFile: string) {
  const port = await freePort()
  const url = `http://127.0.0.1:${port}`
  let output = ''
  const child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    cwd: projectRoot, env: { ...process.env, STC_DATABASE_FILE: databaseFile, STC_HOST: '127.0.0.1', STC_PORT: String(port), STC_COOKIE_SECURE: 'false' }, stdio: ['ignore', 'pipe', 'pipe'],
  })
  children.push(child)
  child.stdout?.on('data', chunk => { output += String(chunk) })
  child.stderr?.on('data', chunk => { output += String(chunk) })
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) throw new Error('Server exited: ' + output)
    try { if ((await fetch(url + '/api/public/schedule', { signal: AbortSignal.timeout(1000) })).ok) return url } catch { /* Await listener startup. */ }
    await new Promise(done => setTimeout(done, 100))
  }
  throw new Error('Server startup timed out: ' + output)
}

test('a backup taken while the server runs restores to a fresh file that serves the same sessions', async () => {
  const liveUrl = await launch(db.databaseFile)
  const auth = await signInAs(liveUrl, credentials)
  const options = await (await adminFetch(liveUrl, auth, '/session-options')).json() as SessionOptions
  const date = addClubDays(clubToday(), 5)
  const created = await adminFetch(liveUrl, auth, '/sessions', { method: 'POST', body: JSON.stringify({ createRequestId: randomUUID(), classId: options.classes[0].id, date, startTime: '18:30', ...options.classes[0].defaults }) })
  expect(created.status).toBe(201)
  const session = (await created.json() as CreateSessionResponse).session

  // The live server keeps running and holds the file open while the snapshot is taken.
  const backup = await backupDatabase(db.prisma, resolve(workDir, 'backups'))
  expect(backup).toMatch(/stc-\d{8}-\d{6}-WIB\.db$/)
  expect(await verifyBackup(backup)).toEqual({ ok: true })

  const restored = await restoreDatabase({ from: backup, to: resolve(workDir, 'restored.db') })
  const restoredUrl = await launch(restored)
  const schedule = await (await fetch(restoredUrl + '/api/public/schedule?date=' + date)).json() as PublicScheduleResponse
  expect(schedule.sessions.map(row => row.id)).toContain(session.id)
})

test('restore refuses to overwrite an existing target without force', async () => {
  const backup = await backupDatabase(db.prisma, resolve(workDir, 'backups'))
  const target = resolve(workDir, 'existing.db')
  writeFileSync(target, 'keep me')
  await expect(restoreDatabase({ from: backup, to: target })).rejects.toThrow(/--force/)
  await expect(restoreDatabase({ from: backup, to: target, force: true })).resolves.toBe(target)
})

test('a truncated backup fails verification and is never restored', async () => {
  const good = await backupDatabase(db.prisma, resolve(workDir, 'backups'))
  const broken = resolve(workDir, 'broken.db')
  copyFileSync(good, broken)
  truncateSync(broken, 2048)
  expect((await verifyBackup(broken)).ok).toBe(false)
  await expect(restoreDatabase({ from: broken, to: resolve(workDir, 'never.db') })).rejects.toThrow(/verification/)
})

test('backups and restores refuse locations the web server serves', async () => {
  await expect(backupDatabase(db.prisma, resolve(projectRoot, 'dist', 'backups'))).rejects.toThrow(/dist\/ or public\//)
  const backup = await backupDatabase(db.prisma, resolve(workDir, 'backups'))
  await expect(restoreDatabase({ from: backup, to: resolve(projectRoot, 'public', 'stc.db') })).rejects.toThrow(/dist\/ or public\//)
})
