import type { Prisma } from '../../../generated/prisma/client.ts'
import type { Database } from '../../../database/transaction.ts'

const bookingFields = {
  id: true,
  status: true,
  quantity: true,
  unitPriceIdr: true,
  totalPriceIdr: true,
  originalDeadline: true,
  createdAt: true,
  participants: { select: { name: true }, orderBy: { position: 'asc' } },
  session: {
    select: {
      id: true,
      startsAt: true,
      durationMinutes: true,
      status: true,
      class: { select: { name: true } },
      level: { select: { name: true } },
      venue: { select: { name: true, address: true, mapUrl: true } },
    },
  },
} satisfies Prisma.BookingSelect

export type CustomerBookingRow = Prisma.BookingGetPayload<{ select: typeof bookingFields }>

// Over by status: expired in storage, or unpaid past its deadline though the worker has not written it yet.
function overWhere(now: Date) {
  return [{ status: 'expired' }, { status: 'awaiting_payment', originalDeadline: { lte: now } }] satisfies Prisma.BookingWhereInput[]
}

export function createMyBookingsRepository(database: Database) {
  return {
    // Still ahead and still standing: nearest session first.
    listUpcoming(customerId: string, now: Date, take: number) {
      return database.booking.findMany({
        where: { customerId, session: { startsAt: { gt: now } }, NOT: { OR: overWhere(now) } },
        select: bookingFields,
        orderBy: [{ session: { startsAt: 'asc' } }, { id: 'asc' }],
        take,
      })
    },
    // Everything else, newest booking first, paged by (createdAt, id).
    listHistory(customerId: string, now: Date, take: number, after: { createdAt: Date; id: string } | null) {
      return database.booking.findMany({
        where: {
          customerId,
          OR: [{ session: { startsAt: { lte: now } } }, ...overWhere(now)],
          ...(after ? { AND: [{ OR: [{ createdAt: { lt: after.createdAt } }, { createdAt: after.createdAt, id: { lt: after.id } }] }] } : {}),
        },
        select: bookingFields,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
      })
    },
    findOwn(customerId: string, id: string) {
      return database.booking.findFirst({ where: { id, customerId }, select: bookingFields })
    },
  }
}
