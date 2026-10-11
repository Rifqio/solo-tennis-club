import type { AdminRosterBooking } from '@shared/api/admin-roster'
import { effectiveBookingStatus } from '@shared/booking-rules'

// Where a booking stands on a roster right now:
// - owes: unpaid, or waiting for a corrected proof, before the original deadline (the "Belum bayar" filter);
// - review: proof sent and waiting for an admin;
// - paid: confirmed;
// - over: the deadline passed without accepted proof, so its places are released (the "Lewat batas" filter).
// Every state but `over` holds its places.
export type RosterState = 'owes' | 'review' | 'paid' | 'over'

export function rosterState(booking: AdminRosterBooking, now: number): RosterState {
  const status = effectiveBookingStatus(booking.status, new Date(booking.originalDeadline), new Date(now))
  if (status === 'awaiting_payment' || status === 'needs_correction') return 'owes'
  if (status === 'awaiting_verification') return 'review'
  return status === 'confirmed' ? 'paid' : 'over'
}
