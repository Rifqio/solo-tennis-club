import type { Database } from '../../database/transaction.ts'

export function createExpiryRepository(database: Database) {
  return {
    findDue(now: Date, take: number) {
      return database.booking.findMany({
        where: { status: 'awaiting_payment', originalDeadline: { lte: now } },
        select: { id: true },
        orderBy: [{ originalDeadline: 'asc' }, { id: 'asc' }],
        take,
      })
    },
    // The status guard makes a repeat, or a booking changed meanwhile, a no-op. The deadline is never touched.
    markExpired(ids: string[], now: Date) {
      return database.booking.updateMany({
        where: { id: { in: ids }, status: 'awaiting_payment', originalDeadline: { lte: now } },
        data: { status: 'expired', version: { increment: 1 } },
      })
    },
  }
}
