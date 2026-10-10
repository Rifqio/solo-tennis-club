import { createPrismaClient, initializeDatabase } from '../server/db.ts'
import { resolveDatabaseFile, resolveUploadsDir } from '../server/config/database-file.ts'
import { backupDatabase, backupUploads, resolveBackupDir } from '../server/ops/backup.ts'

const databaseFile = resolveDatabaseFile()
const prisma = createPrismaClient(databaseFile)
try {
  await initializeDatabase(prisma)
  const file = await backupDatabase(prisma, resolveBackupDir())
  console.log('Backup written: ' + file)
  const uploads = backupUploads(resolveUploadsDir(databaseFile), file)
  if (uploads) console.log('Uploads copied: ' + uploads)
} catch (error) {
  console.error('Backup failed: ' + (error instanceof Error ? error.message : String(error)))
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
