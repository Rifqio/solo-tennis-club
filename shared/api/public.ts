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
  sessions: PublicSessionSummary[]
}
