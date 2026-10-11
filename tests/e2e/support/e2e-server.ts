import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { projectRoot } from '../../../server/config/database-file.ts'
import { createPrismaClient, initializeDatabase } from '../../../server/db.ts'
import { startServer } from '../../../server/start.ts'
import { createSampleCatalog, createSampleSession } from '../../support/fixtures.ts'
import { SAMPLE_SESSION_STARTS_AT } from './sample-session.ts'
import { provisionAdmin } from '../../../server/auth/provisioning.ts'
import { e2eAdminEmail, e2eAdminPassword } from './e2e-credentials.ts'

const root = resolve(tmpdir(), 'lafu-e2e')
const databaseFile = resolve(process.env.LAFU_DATABASE_FILE ?? '')
const childPath = relative(root, databaseFile)
if (!childPath || isAbsolute(childPath) || childPath === '..' || childPath.startsWith('..' + sep)) throw new Error('E2E database must be within lafu-e2e temporary directory')
mkdirSync(dirname(databaseFile), { recursive: true })
for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(databaseFile + suffix, { force: true })
execFileSync(process.execPath, [resolve(projectRoot, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'], {
  cwd: projectRoot, env: { ...process.env, LAFU_DATABASE_FILE: databaseFile }, stdio: 'inherit', timeout: 30000,
})
const prisma = createPrismaClient(databaseFile)
try {
  await initializeDatabase(prisma)
  await provisionAdmin(prisma, { email: e2eAdminEmail, password: e2eAdminPassword, displayName: 'E2E administrator' })
  await createSampleSession(prisma, { catalog: await createSampleCatalog(prisma), startsAt: SAMPLE_SESSION_STARTS_AT })
} finally { await prisma.$disconnect() }
process.env.LAFU_COOKIE_SECURE = 'false'
await startServer({ mode: 'production', databaseFile })
