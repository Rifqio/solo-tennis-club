import type { Prisma } from '../../../generated/prisma/client.ts'
import type { Database } from '../../../database/transaction.ts'
import { activeBookingWhere } from '../../capacity/occupancy.ts'

const sessionRelations = {
  class: true, level: true, venue: true,
  coaches: { include: { coach: true }, orderBy: { position: 'asc' as const } },
} satisfies Prisma.ClassSessionInclude

const rosterRelations = {
  session: { include: sessionRelations },
  participants: { orderBy: { position: 'asc' as const } },
} satisfies Prisma.BookingInclude

export function createRosterRepository(database: Database) {
  return {
    findSession(sessionId: string) {
      return database.classSession.findUnique({ where: { id: sessionId }, include: sessionRelations })
    },
    listBookings(sessionId: string) {
      return database.booking.findMany({
        where: { sessionId },
        include: rosterRelations,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: 201,
      })
    },
    countActivePlaces(sessionId: string, now: Date) {
      return database.bookingParticipant.count({ where: { booking: { sessionId, ...activeBookingWhere(now) } } })
    },
  }
}
