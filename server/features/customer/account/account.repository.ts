import type { Database } from '../../../database/transaction.ts'
import { activeBookingWhere } from '../../capacity/occupancy.ts'

export function createAccountRepository(database: Database) {
  return {
    findCustomer(id: string) {
      return database.customer.findUnique({ where: { id }, select: { id: true, displayName: true, phone: true, verifiedAt: true } })
    },
    countSessionsPlayed(customerId: string, now: Date) {
      return database.booking.count({ where: { customerId, status: 'confirmed', session: { startsAt: { lte: now }, status: { not: 'cancelled' } } } })
    },
    countActiveBookings(customerId: string, now: Date) {
      return database.booking.count({ where: { customerId, ...activeBookingWhere(now), session: { startsAt: { gt: now }, status: 'scheduled' } } })
    },
    updateName(id: string, displayName: string) {
      return database.customer.update({ where: { id }, data: { displayName } })
    },
    updatePhone(id: string, phone: string, verifiedAt: Date) {
      return database.customer.update({ where: { id }, data: { phone, verifiedAt } })
    },
  }
}
