import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { beforeAll, afterAll, expect, test } from 'vitest'
import { createTestDatabase } from '../support/test-db.ts'
import { projectRoot } from '../../server/config/database-file.ts'
let db: Awaited<ReturnType<typeof createTestDatabase>>
beforeAll(async () => { db = await createTestDatabase() })
afterAll(async () => { await db?.cleanup() })
function run(args: string[], input: string) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolveRun, reject) => {
    const child = spawn(process.execPath, [resolve(projectRoot, 'node_modules/tsx/dist/cli.mjs'), 'scripts/admin-provision.ts', ...args], { cwd: projectRoot, env: { ...process.env, LAFU_DATABASE_FILE: db.databaseFile }, stdio: 'pipe' })
    let stdout = '', stderr = ''
    const timeout = setTimeout(() => { child.kill(); reject(new Error('CLI timed out')) }, 15000)
    child.stdout.on('data', chunk => { stdout += String(chunk) }); child.stderr.on('data', chunk => { stderr += String(chunk) })
    child.on('error', error => { clearTimeout(timeout); reject(error) })
    child.on('exit', code => { clearTimeout(timeout); resolveRun({ code, stdout, stderr }) })
    child.stdin.end(input + '\n')
  })
}
test('provisioning stdin creates, updates and deactivates without printing a password or hash', async () => {
  const password = 'test-only-cli-password-97Jx3', email = 'cli@lafu.test'
  const args = ['--email', email, '--name', 'CLI admin', '--password-stdin']
  for (const outcome of ['created', 'updated']) {
    const result = await run(args, password)
    expect(result.code).toBe(0); expect(result.stdout.trim()).toBe(outcome + ' ' + email)
    const account = await db.prisma.adminAccount.findUniqueOrThrow({ where: { email } })
    expect(result.stdout.includes(password) || result.stderr.includes(password)).toBe(false)
    expect(result.stdout.includes(account.passwordHash) || result.stderr.includes(account.passwordHash)).toBe(false)
  }
  expect((await run(['--email', email, '--deactivate'], '')).code).toBe(0)
  expect((await db.prisma.adminAccount.findUniqueOrThrow({ where: { email } })).isActive).toBe(false)
})
test('short password fails with exit 1 and creates nothing', async () => {
  const result = await run(['--email', 'short@lafu.test', '--name', 'Admin', '--password-stdin'], 'short')
  expect(result.code).toBe(1); expect(result.stdout).toBe('')
  expect(await db.prisma.adminAccount.findUnique({ where: { email: 'short@lafu.test' } })).toBeNull()
})
