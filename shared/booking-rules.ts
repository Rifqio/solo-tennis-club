// The original unpaid reservation window. Rejected proof never resets it (PROJECT.md).
export const RESERVATION_HOLD_MS = 5 * 60 * 60 * 1000
// Booking closes when a fresh hold could no longer run its full window before the session starts.
export const BOOKING_CUTOFF_MS = RESERVATION_HOLD_MS

// What a booking is right now. An unpaid booking is expired from its original deadline on, whether or not the
// expiry worker has written that yet; the worker only catches the stored status up.
export type EffectiveBookingStatus = 'awaiting_payment' | 'expired' | 'confirmed'
export function effectiveBookingStatus(status: string, originalDeadline: Date, now: Date): EffectiveBookingStatus {
  if (status === 'awaiting_payment') return originalDeadline > now ? 'awaiting_payment' : 'expired'
  return status === 'confirmed' ? 'confirmed' : 'expired'
}
