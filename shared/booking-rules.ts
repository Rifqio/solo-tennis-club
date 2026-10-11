// The original unpaid reservation window. Rejected proof never resets it (PROJECT.md).
export const RESERVATION_HOLD_MS = 5 * 60 * 60 * 1000
// Booking closes when a fresh hold could no longer run its full window before the session starts.
export const BOOKING_CUTOFF_MS = RESERVATION_HOLD_MS

// A booking's stored status (Phase 3 payment states, 03-ARCHITECTURE §1):
// - awaiting_payment: reserved, no proof yet; holds its places until the original deadline.
// - awaiting_verification: proof sent; holds its places until an admin reviews it, past the deadline too (PAY-04).
// - needs_correction: proof rejected before the deadline; holds its places until the same original deadline (PAY-07).
// - confirmed: paid (approved proof or a payment an admin recorded); holds its places.
// - expired: the deadline passed without accepted proof, or proof was rejected after it (PAY-08); holds nothing.
export const BOOKING_STATUSES = ['awaiting_payment', 'awaiting_verification', 'needs_correction', 'confirmed', 'expired'] as const
export type BookingStatus = typeof BOOKING_STATUSES[number]
// Statuses whose hold ends at the original deadline. Rejection never resets that deadline.
export const DEADLINE_BOUND_STATUSES = ['awaiting_payment', 'needs_correction'] as const
// Statuses that hold their places whatever the time.
export const STANDING_STATUSES = ['awaiting_verification', 'confirmed'] as const

// What a booking is right now. A deadline-bound booking is expired from its original deadline on, whether or not the
// expiry worker has written that yet; the worker only catches the stored status up.
export type EffectiveBookingStatus = BookingStatus
export function effectiveBookingStatus(status: string, originalDeadline: Date, now: Date): EffectiveBookingStatus {
  if ((DEADLINE_BOUND_STATUSES as readonly string[]).includes(status)) return originalDeadline > now ? status as BookingStatus : 'expired'
  if ((STANDING_STATUSES as readonly string[]).includes(status)) return status as BookingStatus
  return 'expired'
}
