import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { SessionOptions } from '../../../../shared/api/admin-sessions.ts'
export async function getSessionOptions(prisma: PrismaClient): Promise<SessionOptions> {
  const orderBy = [{ name: 'asc' as const }, { id: 'asc' as const }]
  const [classes, levels, venues, coaches] = await Promise.all([
    prisma.tennisClass.findMany({ orderBy, include: { defaultCoaches: { orderBy: { position: 'asc' } } } }),
    prisma.level.findMany({ orderBy, select: { id: true, name: true } }),
    prisma.venue.findMany({ orderBy, select: { id: true, name: true } }),
    prisma.coach.findMany({ orderBy, select: { id: true, name: true } }),
  ])
  return { classes: classes.map(row => ({ id: row.id, name: row.name, defaults: { levelId: row.defaultLevelId, venueId: row.defaultVenueId, durationMinutes: row.defaultDurationMinutes, priceIdr: row.defaultPriceIdr, minParticipants: row.defaultMinParticipants, maxParticipants: row.defaultMaxParticipants, coachIds: row.defaultCoaches.map(link => link.coachId) } })), levels, venues, coaches }
}
