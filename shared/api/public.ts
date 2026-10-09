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
  coaches: string[]
  minParticipants: number
  maxParticipants: number
  durationMinutes: number
}
