import type { PrismaClient } from '../../generated/prisma/client.ts'
import { inTransaction } from '../../database/transaction.ts'
import { CLUB_TIME_ZONE, clubDateOf, clubDayRange, clubTimeOf, clubToday } from '../../../shared/club-time.ts'
import { deriveAvailability } from '../../../shared/availability.ts'
import type { PublicScheduleResponse, PublicSessionSummary } from '../../../shared/api/public.ts'
import { publicScheduleWindow } from '../../../shared/schedule-window.ts'
import { ApiError } from '../../http/errors.ts'
import { getOccupiedPlaceCounts } from '../capacity/occupancy.ts'
import { createPublicSessionRepository, type PublicSummaryRow } from './public-session.repository.ts'

export function toPublicSessionSummary(session: PublicSummaryRow, occupiedPlaces = 0): PublicSessionSummary {
  const endsAt = new Date(session.startsAt.getTime() + session.durationMinutes * 60_000)
  const remainingPlaces = Math.max(0, session.maxParticipants - occupiedPlaces)
  return {
    id: session.id,
    startsAt: session.startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    date: clubDateOf(session.startsAt),
    startTime: clubTimeOf(session.startsAt),
    endTime: clubTimeOf(endsAt),
    className: session.class.name,
    levelName: session.level.name,
    venueName: session.venue.name,
    priceIdr: session.priceIdr,
    remainingPlaces,
    availability: deriveAvailability({
      sessionStatus: session.status,
      maxParticipants: session.maxParticipants,
      remainingPlaces,
    }),
    isSample: session.isSample || session.class.isSample || session.level.isSample
      || session.venue.isSample || session.coaches.some(link => link.coach.isSample),
  }
}

export async function getPublicSchedule(
  database: PrismaClient,
  date: string,
  now = new Date(),
): Promise<PublicScheduleResponse> {
  const today = clubToday(now)
  const { minDate, maxDate } = publicScheduleWindow(today)
  if (date < minDate || date > maxDate) throw new ApiError(400, 'DATE_OUT_OF_RANGE')

  const { start, end } = clubDayRange(date)
  return inTransaction(database, async transaction => {
    const repository = createPublicSessionRepository(transaction)
    const [sessions, next] = await Promise.all([
      repository.listInRange(start, end),
      repository.findNextStart(end, clubDayRange(maxDate).end),
    ])
    const occupied = await getOccupiedPlaceCounts(transaction, sessions.map(session => session.id), now)
    return {
      date,
      today,
      timeZone: CLUB_TIME_ZONE,
      nextDate: next ? clubDateOf(next.startsAt) : null,
      minDate,
      maxDate,
      sessions: sessions.map(session => toPublicSessionSummary(session, occupied.get(session.id) ?? 0)),
    }
  })
}
