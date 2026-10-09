import type { PrismaClient } from '../../generated/prisma/client.ts'
import { inTransaction } from '../../database/transaction.ts'
import { BOOKING_CUTOFF_MS } from '../../../shared/booking-rules.ts'
import { clubDayRange, clubToday } from '../../../shared/club-time.ts'
import type { PublicUpcomingResponse } from '../../../shared/api/public.ts'
import { publicScheduleWindow } from '../../../shared/schedule-window.ts'
import { getOccupiedPlaceCounts } from '../capacity/occupancy.ts'
import { createPublicSessionRepository } from './public-session.repository.ts'
import { toPublicSessionSummary } from './schedule.service.ts'

export const UPCOMING_LIMIT = 10
// Full sessions are skipped after counting places, so read a few extra candidates to still fill the list.
const CANDIDATE_LIMIT = 40

export async function getUpcomingBookable(database: PrismaClient, now = new Date()): Promise<PublicUpcomingResponse> {
  const today = clubToday(now)
  const opensAfter = new Date(now.getTime() + BOOKING_CUTOFF_MS)
  const windowEnd = clubDayRange(publicScheduleWindow(today).maxDate).end
  return inTransaction(database, async transaction => {
    const candidates = await createPublicSessionRepository(transaction).listScheduledInRange(opensAfter, windowEnd, CANDIDATE_LIMIT)
    const occupied = await getOccupiedPlaceCounts(transaction, candidates.map(session => session.id), now)
    const sessions = candidates
      .map(session => toPublicSessionSummary(session, occupied.get(session.id) ?? 0))
      .filter(session => session.remainingPlaces > 0)
      .slice(0, UPCOMING_LIMIT)
    return { today, sessions }
  })
}
