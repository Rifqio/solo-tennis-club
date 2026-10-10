import type { AdminRosterBooking } from '@shared/api/admin-roster'

// A booking still holds its places while it awaits payment and its deadline has not passed.
export function isActive(booking: AdminRosterBooking, now: number) {
  return booking.status === 'awaiting_payment' && Date.parse(booking.originalDeadline) > now
}
