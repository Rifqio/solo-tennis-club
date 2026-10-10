import type { PrismaClient } from '../../generated/prisma/client.ts'
import { inWriteTransaction } from '../../database/transaction.ts'
import { createExpiryRepository } from './expiry.repository.ts'

export const EXPIRY_BATCH = 100
export const EXPIRY_MAX_BATCHES = 20
export const EXPIRY_INTERVAL_MS = 30_000

// Writes "expired" on unpaid bookings past their original deadline, in short bounded batches. Counts and screens
// already treat them as expired at the deadline (effectiveBookingStatus); this only keeps storage in step.
export async function expireDueBookings(database: PrismaClient, now: Date, batch = EXPIRY_BATCH, maxBatches = EXPIRY_MAX_BATCHES) {
  let expired = 0
  for (let round = 0; round < maxBatches; round++) {
    const changed = await inWriteTransaction(database, async transaction => {
      const repository = createExpiryRepository(transaction)
      const due = await repository.findDue(now, batch)
      if (!due.length) return 0
      const result = await repository.markExpired(due.map(row => row.id), now)
      return result.count
    })
    expired += changed
    if (changed < batch) break
  }
  return expired
}

// Runs once at startup and then on an interval. A slow round is never overlapped by the next one.
export function startExpiryWorker(database: PrismaClient, options: { intervalMs?: number; clock?: () => Date } = {}) {
  const clock = options.clock ?? (() => new Date())
  let running: Promise<unknown> | null = null
  let stopped = false
  const tick = () => {
    if (running || stopped) return
    running = expireDueBookings(database, clock())
      .catch(error => console.error('Booking expiry round failed', error instanceof Error ? error.message : error))
      .finally(() => { running = null })
  }
  tick()
  const timer = setInterval(tick, options.intervalMs ?? EXPIRY_INTERVAL_MS)
  timer.unref?.()
  return {
    async stop() {
      stopped = true
      clearInterval(timer)
      await running
    },
  }
}
