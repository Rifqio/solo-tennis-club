import type { PublicSessionSummary } from '@shared/api/public'
import { BOOKING_CUTOFF_MS } from '@shared/booking-rules'
import type { SessionTiming } from './session-timing'

// Mirrors the server's admission rule for display only; the server still decides when a booking is made.
export function canBookSession(session: PublicSessionSummary, now: number) {
  if (session.availability !== 'available' && session.availability !== 'nearly_full') return false
  return Date.parse(session.startsAt) - now > BOOKING_CUTOFF_MS
}

// Sessions the "available only" switch hides: nothing left to join.
export function isUnavailable(session: PublicSessionSummary, timing: SessionTiming | undefined) {
  return session.availability === 'full' || session.availability === 'cancelled' || timing === 'ended'
}
