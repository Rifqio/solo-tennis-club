import type { AdminSessionDetail } from '../../../../shared/api/admin-sessions.ts'
import { clubDateOf, clubTimeOf } from '../../../../shared/club-time.ts'
import type { SessionRow } from './session.repository.ts'

export function toAdminSessionDetail(row: SessionRow, occupiedPlaces = 0): AdminSessionDetail {
  const endsAt = new Date(row.startsAt.getTime() + row.durationMinutes * 60_000)
  return {
    id: row.id,
    version: row.version,
    classId: row.classId,
    className: row.class.name,
    date: clubDateOf(row.startsAt),
    startTime: clubTimeOf(row.startsAt),
    endTime: clubTimeOf(endsAt),
    startsAt: row.startsAt.toISOString(),
    durationMinutes: row.durationMinutes,
    levelId: row.levelId,
    levelName: row.level.name,
    venueId: row.venueId,
    venueName: row.venue.name,
    coaches: row.coaches.map(link => ({ id: link.coach.id, name: link.coach.name })),
    priceIdr: row.priceIdr,
    minParticipants: row.minParticipants,
    maxParticipants: row.maxParticipants,
    remainingPlaces: Math.max(0, row.maxParticipants - occupiedPlaces),
    status: row.status,
    isSample: row.isSample || row.class.isSample || row.level.isSample || row.venue.isSample
      || row.coaches.some(link => link.coach.isSample),
  }
}
