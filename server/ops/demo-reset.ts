import type { PrismaClient } from '../generated/prisma/client.ts'
import { inTransaction } from '../database/transaction.ts'
import type { FileStores } from '../storage/file-store.ts'
import { ensureDemoAdmin } from '../auth/demo-admin.ts'
import { SEED_TRANSACTION_MS, seedSampleAlbums, seedSampleCoaches, seedSampleData } from './sample-data.ts'

// The hosted demo's nightly reset (STC_DEMO=1, run by the daily cron). Everything visitors could have made or
// changed goes: members, their bookings, proofs and payments, sessions, classes, coaches, venues, levels, photos and
// every uploaded file. The sample club is then seeded again from today, so the demo always starts clean and Blob stays
// within its free limits. Admin accounts stay, so the demo admin keeps working.
const UPLOADED_PREFIXES: Array<[keyof FileStores, string]> = [
  ['publicFiles', 'sessions/'], ['publicFiles', 'coaches/'], ['privateFiles', 'proofs/'], ['privateFiles', 'incoming/'],
]

export async function resetDemoData(prisma: PrismaClient, files: FileStores, publicDir: string, now = new Date()) {
  let removedFiles = 0
  for (const [store, prefix] of UPLOADED_PREFIXES) {
    const keys = await files[store].list(prefix)
    for (let start = 0; start < keys.length; start += 100) await files[store].remove(keys.slice(start, start + 100))
    removedFiles += keys.length
  }
  await inTransaction(prisma, async transaction => {
    // Children before parents, so the reset never depends on cascades.
    await transaction.paymentRecord.deleteMany()
    await transaction.paymentProofFile.deleteMany()
    await transaction.paymentProof.deleteMany()
    await transaction.bookingOwnershipEvent.deleteMany()
    await transaction.bookingParticipant.deleteMany()
    await transaction.booking.deleteMany()
    await transaction.customerSession.deleteMany()
    await transaction.otpAttempt.deleteMany()
    await transaction.otpChallenge.deleteMany()
    await transaction.customer.deleteMany()
    await transaction.sessionPhoto.deleteMany()
    await transaction.sessionCoach.deleteMany()
    await transaction.classSession.deleteMany()
    await transaction.classDefaultCoach.deleteMany()
    await transaction.tennisClass.deleteMany()
    await transaction.coach.deleteMany()
    await transaction.venue.deleteMany()
    await transaction.level.deleteMany()
    await transaction.loginAttempt.deleteMany()
  }, { maxWait: 10_000, timeout: SEED_TRANSACTION_MS })
  await ensureDemoAdmin(prisma)
  await seedSampleData(prisma, { now })
  await seedSampleCoaches(prisma)
  const albums = await seedSampleAlbums(prisma, { now, publicDir })
  return { removedFiles, albums }
}
