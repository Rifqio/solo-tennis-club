import type { Prisma } from '../../../generated/prisma/client.ts'
import type { Database } from '../../../database/transaction.ts'

const recapBookingFields = {
  id: true,
  status: true,
  quantity: true,
  totalPriceIdr: true,
  originalDeadline: true,
  confirmedAt: true,
  bookerName: true,
  bookerPhone: true,
} satisfies Prisma.BookingSelect

const recapSessionFields = {
  id: true,
  startsAt: true,
  status: true,
  maxParticipants: true,
  class: { select: { id: true, name: true } },
  bookings: { select: recapBookingFields, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ClassSessionSelect

export type RecapSession = Prisma.ClassSessionGetPayload<{ select: typeof recapSessionFields }>

export function createRecapRepository(database: Database) {
  return {
    // Every session starting inside [start, end), with its bookings: the month's whole picture in one read.
    sessionsBetween(start: Date, end: Date): Promise<RecapSession[]> {
      return database.classSession.findMany({
        where: { startsAt: { gte: start, lt: end } },
        select: recapSessionFields,
        orderBy: { startsAt: 'asc' },
      })
    },
    // Paid bookings for sessions inside [start, end): what the six-month bars and the comparison need. `paidBefore`
    // keeps only those paid by then (a booking confirmed before confirmedAt was recorded counts as paid in time).
    paidBookingsBetween(start: Date, end: Date, paidBefore?: Date) {
      return database.booking.findMany({
        where: {
          status: 'confirmed', session: { startsAt: { gte: start, lt: end }, status: { not: 'cancelled' } },
          ...(paidBefore ? { OR: [{ confirmedAt: null }, { confirmedAt: { lt: paidBefore } }] } : {}),
        },
        select: { totalPriceIdr: true, session: { select: { startsAt: true } } },
      })
    },
  }
}
