import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { SessionOptions } from '../../../../shared/api/admin-sessions.ts'
import { createSessionRepository } from './session.repository.ts'

export async function getSessionOptions(database: PrismaClient): Promise<SessionOptions> {
  const { classes, levels, venues, coaches } = await createSessionRepository(database).getOptions()
  return {
    classes: classes.map(row => ({
      id: row.id,
      name: row.name,
      defaults: {
        levelId: row.defaultLevelId,
        venueId: row.defaultVenueId,
        durationMinutes: row.defaultDurationMinutes,
        priceIdr: row.defaultPriceIdr,
        minParticipants: row.defaultMinParticipants,
        maxParticipants: row.defaultMaxParticipants,
        coachIds: row.defaultCoaches.map(link => link.coachId),
      },
    })),
    levels,
    venues,
    coaches: coaches.map(row => ({ id: row.id, name: row.name, photoUrl: row.photoUrl, classCount: row._count.defaultClasses })),
  }
}
