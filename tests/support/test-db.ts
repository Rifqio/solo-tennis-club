import { randomUUID } from 'node:crypto'
import { copyFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { inject } from 'vitest'
import { createPrismaClient, initializeDatabase } from '../../server/db.ts'

// Every test file gets its own copy of the run's migrated template (see global-setup.ts), so files stay isolated
// without each one starting a Prisma schema engine.
export async function createTestDatabase() {
  const root = resolve(tmpdir(), 'lafu-tests')
  mkdirSync(root, { recursive: true })
  const databaseFile = resolve(root, randomUUID() + '.db')
  copyFileSync(inject('templateDatabaseFile'), databaseFile)
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
