import { createPrismaClient, initializeDatabase } from '../server/db.ts'
import { resolveDatabaseFile } from '../server/config/database-file.ts'
import { seedSampleCoaches, seedSampleData } from '../server/ops/sample-data.ts'

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
  const coaches = await seedSampleCoaches(prisma)
  const messages = {
    created: 'Sample data created (labeled "Contoh", development only): ',
    refreshed: 'Sample sessions re-dated from today: ',
    skipped: 'Sample data already present; nothing changed (use --refresh to re-date sessions): ',
  }
  console.log(messages[outcome] + file)
  console.log(coaches ? `Sample coaches added or given a photo: ${coaches}` : 'Sample coaches already present with their photos.')
} catch (error) {
  console.error('Seeding failed: ' + (error instanceof Error ? error.message : String(error)))
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
