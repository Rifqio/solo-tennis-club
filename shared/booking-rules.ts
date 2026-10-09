// The original unpaid reservation window. Rejected proof never resets it (PROJECT.md).
export const RESERVATION_HOLD_MS = 5 * 60 * 60 * 1000
// Booking closes when a fresh hold could no longer run its full window before the session starts.
export const BOOKING_CUTOFF_MS = RESERVATION_HOLD_MS
