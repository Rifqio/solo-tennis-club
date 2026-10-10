import type { Prisma } from '../../../generated/prisma/client.ts'
import type { Database } from '../../../database/transaction.ts'
import { activeBookingWhere } from '../../capacity/occupancy.ts'

const summaryFields = {
  id: true,
  status: true,
  bookerName: true,
  bookerPhone: true,
  quantity: true,
  unitPriceIdr: true,
  totalPriceIdr: true,
  originalDeadline: true,
  createdAt: true,
  actorKind: true,
  session: { select: { id: true, startsAt: true, durationMinutes: true, status: true, class: { select: { name: true } }, level: { select: { name: true } }, venue: { select: { name: true } } } },
} satisfies Prisma.BookingSelect

const detailFields = {
  ...summaryFields,
  participants: { select: { name: true }, orderBy: { position: 'asc' } },
  customer: { select: { displayName: true, phone: true, verifiedAt: true } },
} satisfies Prisma.BookingSelect

export type AdminBookingRow = Prisma.BookingGetPayload<{ select: typeof summaryFields }>
export type AdminBookingDetailRow = Prisma.BookingGetPayload<{ select: typeof detailFields }>
export type Cursor = { at: Date; id: string }

export function createAdminBookingRepository(database: Database) {
  return {
    // Still holding places: the deadline nearest now first, paged by (deadline, id).
    listUnpaid(now: Date, take: number, after: Cursor | null) {
      return database.booking.findMany({
        where: {
          ...activeBookingWhere(now),
          ...(after ? { OR: [{ originalDeadline: { gt: after.at } }, { originalDeadline: after.at, id: { gt: after.id } }] } : {}),
        },
        select: summaryFields,
        orderBy: [{ originalDeadline: 'asc' }, { id: 'asc' }],
        take,
      })
    },
    // Newest booking first, paged by (createdAt, id); optionally only one stored status.
    listRecent(status: string | null, take: number, after: Cursor | null) {
      return database.booking.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(after ? { OR: [{ createdAt: { lt: after.at } }, { createdAt: after.at, id: { lt: after.id } }] } : {}),
        },
        select: summaryFields,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take,
      })
    },
    countUnpaid(now: Date) {
      return database.booking.count({ where: activeBookingWhere(now) })
    },
    findDetail(id: string) {
      return database.booking.findUnique({ where: { id }, select: detailFields })
    },
  }
}
