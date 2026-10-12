import type { PrismaClient } from '../../generated/prisma/client.ts'
import type { FileStores } from '../../storage/file-store.ts'
import { expireDueBookings } from '../booking-expiry/expiry.service.ts'
import { resetDemoData } from '../../ops/demo-reset.ts'

// The daily job on the hosted demo, where no process stays up to run the expiry worker. Capacity already ignores an
// unpaid booking the moment its deadline passes, so expiring here only tidies statuses. The demo is then reset.
export async function runDailyJobs(database: PrismaClient, options: { demo: boolean; files: FileStores; publicDir: string; now?: Date }) {
  const now = options.now ?? new Date()
  const expired = await expireDueBookings(database, now)
  const reset = options.demo ? await resetDemoData(database, options.files, options.publicDir, now) : null
  return { expired, reset }
}
