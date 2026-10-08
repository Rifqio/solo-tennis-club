import type { PrismaClient, Prisma } from '../../generated/prisma/client.ts'
import { CLUB_TIME_ZONE, clubDateOf, clubDayRange, clubTimeOf, clubToday } from '../../../shared/club-time.ts'
import { deriveAvailability } from '../../../shared/availability.ts'
import type { PublicScheduleResponse, PublicSessionSummary } from '../../../shared/api/public.ts'
import { getOccupiedPlaceCounts } from '../capacity/occupancy.ts'

const summarySelect = {
  id: true, startsAt: true, durationMinutes: true, priceIdr: true,
  maxParticipants: true, status: true, isSample: true,
  class: { select: { name: true } },
  level: { select: { name: true } },
  venue: { select: { name: true } },
} satisfies Prisma.ClassSessionSelect
type SummaryRecord = Prisma.ClassSessionGetPayload<{ select: typeof summarySelect }>
export function toPublicSessionSummary(session: SummaryRecord, occupiedPlaces = 0): PublicSessionSummary {
  const endsAt = new Date(session.startsAt.getTime() + session.durationMinutes * 60_000)
  const remainingPlaces = Math.max(0, session.maxParticipants - occupiedPlaces)
  return {
    id: session.id, startsAt: session.startsAt.toISOString(), endsAt: endsAt.toISOString(),
    date: clubDateOf(session.startsAt), startTime: clubTimeOf(session.startsAt), endTime: clubTimeOf(endsAt),
    className: session.class.name, levelName: session.level.name, venueName: session.venue.name,
    priceIdr: session.priceIdr, remainingPlaces,
    availability: deriveAvailability({ sessionStatus: session.status, maxParticipants: session.maxParticipants, remainingPlaces }),
    isSample: session.isSample,
  }
}
export async function getPublicSchedule(db: PrismaClient | Prisma.TransactionClient, date: string, now = new Date()): Promise<PublicScheduleResponse> {
  const { start, end } = clubDayRange(date)
  const sessions = await db.classSession.findMany({
    where: { startsAt: { gte: start, lt: end } },
    select: summarySelect, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
  })
  const occupied = await getOccupiedPlaceCounts(db, sessions.map(session => session.id))
  return { date, today: clubToday(now), timeZone: CLUB_TIME_ZONE, sessions: sessions.map(session => toPublicSessionSummary(session, occupied.get(session.id) ?? 0)) }
}
