import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { AdminSessionListResponse } from '../../../../shared/api/admin-sessions.ts'
import { clubDateOf, clubDayRange, clubToday, isClubDate } from '../../../../shared/club-time.ts'
import { publicScheduleWindow } from '../../../../shared/schedule-window.ts'
import { ApiError } from '../../../http/errors.ts'
import { inTransaction } from '../../../database/transaction.ts'
import { getOccupiedPlaceCounts } from '../../capacity/occupancy.ts'
import { createSessionRepository } from './session.repository.ts'
import { toAdminSessionDetail } from './session.mapper.ts'

export async function listAdminSessions(
  database: PrismaClient,
  now = new Date(),
  date?: string,
): Promise<AdminSessionListResponse> {
  const today = clubToday(now)
  const { minDate, maxDate } = publicScheduleWindow(today)
  if (date !== undefined && !isClubDate(date)) throw new ApiError(400, 'INVALID_DATE')
  if (date !== undefined && (date < minDate || date > maxDate)) {
    throw new ApiError(400, 'DATE_OUT_OF_RANGE')
  }

  const range = clubDayRange(date ?? today)
  return inTransaction(database, async transaction => {
    const repository = createSessionRepository(transaction)
    const [rows, next, starts] = await Promise.all([
      repository.listFrom(range.start, date ? range.end : undefined),
      repository.findNextStart(range.end, clubDayRange(maxDate).end),
      repository.listScheduledStarts(clubDayRange(minDate).start, clubDayRange(maxDate).end),
    ])
    const dayCounts: Record<string, number> = {}
    for (const { startsAt } of starts) { const day = clubDateOf(startsAt); dayCounts[day] = (dayCounts[day] ?? 0) + 1 }
    const sessions = rows.slice(0, 200)
    const occupied = await getOccupiedPlaceCounts(transaction, sessions.map(row => row.id), now)
    return {
      today,
      date: date ?? null,
      minDate,
      maxDate,
      nextDate: next ? clubDateOf(next.startsAt) : null,
      truncated: rows.length > 200,
      dayCounts,
      sessions: sessions.map(row => toAdminSessionDetail(row, occupied.get(row.id) ?? 0)),
    }
  })
}

