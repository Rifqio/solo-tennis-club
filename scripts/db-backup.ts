import { createPrismaClient, initializeDatabase } from '../server/db.ts'
import { resolveDatabaseFile } from '../server/config/database-file.ts'
import { backupDatabase, resolveBackupDir } from '../server/ops/backup.ts'

const prisma = createPrismaClient(resolveDatabaseFile())
try {
  await initializeDatabase(prisma)
  const file = await backupDatabase(prisma, resolveBackupDir())
  console.log('Backup written: ' + file)
} catch (error) {
  console.error('Backup failed: ' + (error instanceof Error ? error.message : String(error)))
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
