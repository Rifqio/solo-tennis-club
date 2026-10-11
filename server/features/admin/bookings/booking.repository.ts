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
  version: true,
  ownershipEvents: { select: { createdAt: true, admin: { select: { displayName: true } } }, orderBy: { createdAt: 'desc' }, take: 1 },
} satisfies Prisma.BookingSelect

export type AdminBookingRow = Prisma.BookingGetPayload<{ select: typeof summaryFields }>
export type AdminBookingDetailRow = Prisma.BookingGetPayload<{ select: typeof detailFields }>
export type Cursor = { at: Date; id: string }

// Name or phone: the typed text against the booker's name, and its digits (without a leading 0, so "0812" finds
// "+62812...") against the stored phone.
function searchWhere(search: string | null): Prisma.BookingWhereInput {
  const text = search?.trim()
  if (!text) return {}
  const digits = text.replace(/\D/g, '').replace(/^0+/, '')
  return { OR: [{ bookerName: { contains: text } }, ...(digits.length >= 3 ? [{ bookerPhone: { contains: digits } }] : [])] }
}

export function createAdminBookingRepository(database: Database) {
  return {
    // Still holding places: the deadline nearest now first, paged by (deadline, id).
    listUnpaid(now: Date, take: number, after: Cursor | null, search: string | null = null) {
      return database.booking.findMany({
        where: {
          ...activeBookingWhere(now),
          AND: [
            after ? { OR: [{ originalDeadline: { gt: after.at } }, { originalDeadline: after.at, id: { gt: after.id } }] } : {},
            searchWhere(search),
          ],
        },
        select: summaryFields,
        orderBy: [{ originalDeadline: 'asc' }, { id: 'asc' }],
        take,
      })
    },
    // Newest booking first, paged by (createdAt, id); optionally only one stored status.
    listRecent(status: string | null, take: number, after: Cursor | null, search: string | null = null) {
      return database.booking.findMany({
        where: {
          ...(status ? { status } : {}),
          AND: [
            after ? { OR: [{ createdAt: { lt: after.at } }, { createdAt: after.at, id: { lt: after.id } }] } : {},
            searchWhere(search),
          ],
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
    findLinkTarget(id: string) {
      return database.booking.findUnique({ where: { id }, select: { id: true, version: true, customerId: true, bookerPhone: true } })
    },
    findVerifiedCustomerByPhone(phone: string) {
      return database.customer.findFirst({ where: { phone, isActive: true }, select: { id: true, displayName: true, phone: true, verifiedAt: true } })
    },
    findVerifiedCustomer(id: string) {
      return database.customer.findFirst({ where: { id, isActive: true }, select: { id: true, phone: true } })
    },
    // Only an unowned booking at the version the admin saw; zero rows means someone changed or linked it first.
    linkIfUnownedAtVersion(id: string, customerId: string, version: number) {
      return database.booking.updateMany({ where: { id, version, customerId: null }, data: { customerId, version: { increment: 1 } } })
    },
    recordOwnershipEvent(data: { bookingId: string; adminId: string; customerId: string; bookingVersion: number }) {
      return database.bookingOwnershipEvent.create({ data: { ...data, previousCustomerId: null } })
    },
  }
}
