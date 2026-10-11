import type { Database } from '../../database/transaction.ts'
import { DEADLINE_BOUND_STATUSES } from '../../../shared/booking-rules.ts'

export function createExpiryRepository(database: Database) {
  return {
    findDue(now: Date, take: number) {
      return database.booking.findMany({
        where: { status: { in: [...DEADLINE_BOUND_STATUSES] }, originalDeadline: { lte: now } },
        select: { id: true },
        orderBy: [{ originalDeadline: 'asc' }, { id: 'asc' }],
        take,
      })
    },
    // Unpaid and needs-correction bookings expire at the original deadline; a proof awaiting review never does.
    // The status guard makes a repeat, or a booking changed meanwhile, a no-op. The deadline is never touched.
    markExpired(ids: string[], now: Date) {
      return database.booking.updateMany({
        where: { id: { in: ids }, status: { in: [...DEADLINE_BOUND_STATUSES] }, originalDeadline: { lte: now } },
        data: { status: 'expired', version: { increment: 1 } },
      })
    },
  }
}
