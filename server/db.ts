import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from './generated/prisma/client.ts'
import { databaseUrl, resolveDatabaseTarget, type DatabaseTarget } from './config/database-file.ts'

// A local SQLite file path, or a resolved target. Local files use better-sqlite3; Turso (the hosted demo) uses libSQL.
// libSQL's native driver keeps local files open after close on Windows, so it is only used for remote databases.
export function createPrismaClient(target: string | DatabaseTarget = resolveDatabaseTarget()) {
  if (typeof target === 'string') return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl(target) }) })
  if (target.local) return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: target.url }) })
  return new PrismaClient({ adapter: new PrismaLibSql({ url: target.url, authToken: target.authToken }) })
}

// Local files get WAL and a busy timeout and refuse to start without foreign keys. Turso manages its own journal and
// locking; foreign keys are requested on the connection, and the go-live checklist confirms they hold there.
export async function initializeDatabase(prisma: PrismaClient, { local = true }: { local?: boolean } = {}) {
  if (!local) {
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
    return
  }
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL')
  await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000')
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
  const result = await prisma.$queryRawUnsafe<Array<{ foreign_keys: bigint | number }>>('PRAGMA foreign_keys')
  if (Number(result[0]?.foreign_keys) !== 1) throw new Error('SQLite foreign keys must be enabled')
}
