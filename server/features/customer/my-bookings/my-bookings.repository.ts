import type { Prisma } from '../../../generated/prisma/client.ts'
import type { Database } from '../../../database/transaction.ts'
import { DEADLINE_BOUND_STATUSES } from '../../../../shared/booking-rules.ts'

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
      photos: { where: { deletedAt: null }, orderBy: [{ isCover: 'desc' }, { position: 'asc' }, { id: 'asc' }], take: 3, select: { id: true, url: true, width: true, height: true } },
      _count: { select: { photos: { where: { deletedAt: null } } } },
    },
  },
} satisfies Prisma.BookingSelect

export type CustomerBookingRow = Prisma.BookingGetPayload<{ select: typeof bookingFields }>

// One booking also carries the latest rejected proof's reason, which the member reads on the booking (9h).
const detailFields = {
  ...bookingFields,
  paymentProofs: { where: { status: 'rejected' }, orderBy: { reviewedAt: 'desc' }, take: 1, select: { rejectionReason: true, rejectionNote: true } },
} satisfies Prisma.BookingSelect

// Over by status: expired in storage, or past its deadline while unpaid or awaiting a corrected proof, though the
// worker has not written it yet. A proof awaiting review is never over by time.
function overWhere(now: Date) {
  return [{ status: 'expired' }, { status: { in: [...DEADLINE_BOUND_STATUSES] }, originalDeadline: { lte: now } }] satisfies Prisma.BookingWhereInput[]
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
      return database.booking.findFirst({ where: { id, customerId }, select: detailFields })
    },
  }
}
