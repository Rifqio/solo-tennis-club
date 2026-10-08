import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/prisma/client.ts'
import { databaseUrl, resolveDatabaseFile } from './config/database-file.ts'

export function createPrismaClient(databaseFile = resolveDatabaseFile()) {
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl(databaseFile) }) })
}
export async function initializeDatabase(prisma: PrismaClient) {
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL')
  await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000')
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')
  const result = await prisma.$queryRawUnsafe<Array<{ foreign_keys: bigint | number }>>('PRAGMA foreign_keys')
  if (Number(result[0]?.foreign_keys) !== 1) throw new Error('SQLite foreign keys must be enabled')
}
