import { createPrismaClient, initializeDatabase } from '../server/db.ts'
import { resolveDatabaseFile } from '../server/config/database-file.ts'
import { seedSampleData } from '../server/ops/sample-data.ts'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed sample data when NODE_ENV is production.')
  process.exit(1)
}
const refresh = process.argv.includes('--refresh')
const file = resolveDatabaseFile()
const prisma = createPrismaClient(file)
try {
  await initializeDatabase(prisma)
  const outcome = await seedSampleData(prisma, { refresh })
  const messages = {
    created: 'Sample data created (labeled "Contoh", development only): ',
    refreshed: 'Sample sessions re-dated from today: ',
    skipped: 'Sample data already present; nothing changed (use --refresh to re-date sessions): ',
  }
  console.log(messages[outcome] + file)
} catch (error) {
  console.error('Seeding failed: ' + (error instanceof Error ? error.message : String(error)))
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
