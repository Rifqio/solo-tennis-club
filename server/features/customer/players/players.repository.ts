import type { Database } from '../../../database/transaction.ts'
import { activeBookingWhere } from '../../capacity/occupancy.ts'

export function createPlayersRepository(database: Database) {
  return {
    // Names only: phone numbers and booking details stay private to the booker and the club.
    listActivePlayerNames(start: Date, end: Date, now: Date) {
      return database.bookingParticipant.findMany({
        where: { booking: { ...activeBookingWhere(now), session: { startsAt: { gte: start, lt: end } } } },
        select: { name: true, booking: { select: { sessionId: true } } },
        orderBy: [{ booking: { createdAt: 'asc' } }, { position: 'asc' }],
      })
    },
  }
}
