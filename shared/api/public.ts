import type { AvailabilityStatus } from '../availability.ts'
export interface PublicSessionSummary {
  id: string
  startsAt: string
  endsAt: string
  date: string
  startTime: string
  endTime: string
  className: string
  levelName: string
  venueName: string
  priceIdr: number
  remainingPlaces: number
  availability: AvailabilityStatus
  isSample: boolean
}
export interface PublicScheduleResponse {
  date: string
  today: string
  timeZone: string
  // First club date after `date` with any session (cancelled included), or null within the window.
  nextDate: string | null
  minDate: string
  maxDate: string
  sessions: PublicSessionSummary[]
}
export interface PublicSessionDetail extends PublicSessionSummary {
  version: number
  venueAddress?: string | null
  // The admin's Google Maps link for the venue, or null when none is saved.
  venueMapUrl?: string | null
  coaches: string[]
  minParticipants: number
  maxParticipants: number
  durationMinutes: number
}
// The next sessions a customer can still reserve: scheduled, open for booking and with places left.
export interface PublicUpcomingResponse {
  today: string
  sessions: PublicSessionSummary[]
}
// The places sessions are held, for the club page.
export interface PublicVenue { id: string; name: string; address: string | null; mapUrl: string | null; isSample: boolean }
export interface PublicVenuesResponse { venues: PublicVenue[] }
