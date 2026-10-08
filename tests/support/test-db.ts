import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { createPrismaClient, initializeDatabase } from '../../server/db.ts'
import { projectRoot } from '../../server/config/database-file.ts'

export async function createTestDatabase() {
  const root = resolve(tmpdir(), 'lafu-tests')
  mkdirSync(root, { recursive: true })
  const databaseFile = resolve(root, randomUUID() + '.db')
  execFileSync(process.execPath, [resolve(projectRoot, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: projectRoot, env: { ...process.env, LAFU_DATABASE_FILE: databaseFile }, stdio: 'pipe', timeout: 30000,
  })
  const prisma = createPrismaClient(databaseFile)
  await initializeDatabase(prisma)
  return {
    databaseFile, prisma,
    async cleanup() {
      await prisma.$disconnect()
      const path = relative(root, databaseFile)
      if (!path || isAbsolute(path) || path === '..' || path.startsWith('..' + sep)) throw new Error('Unsafe test database cleanup')
      for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(databaseFile + suffix, { force: true })
    },
  }
}
