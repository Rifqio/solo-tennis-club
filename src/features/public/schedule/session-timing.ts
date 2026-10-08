import type { PublicSessionSummary } from '@shared/api/public'

export type SessionTiming = 'upcoming' | 'next' | 'in_progress' | 'ended'

// Where each session sits relative to now on the trail. Only the first upcoming, non-cancelled session is "next".
export function sessionTimings(sessions: PublicSessionSummary[], now: number): Map<string, SessionTiming> {
  const timings = new Map<string, SessionTiming>()
  let nextAssigned = false
  for (const session of sessions) {
    const start = Date.parse(session.startsAt)
    const end = Date.parse(session.endsAt)
    if (end <= now) timings.set(session.id, 'ended')
    else if (start <= now) timings.set(session.id, 'in_progress')
    else if (!nextAssigned && session.availability !== 'cancelled') { timings.set(session.id, 'next'); nextAssigned = true }
    else timings.set(session.id, 'upcoming')
  }
  return timings
}

export function minutesUntil(startsAt: string, now: number) {
  return Math.max(1, Math.ceil((Date.parse(startsAt) - now) / 60_000))
}
