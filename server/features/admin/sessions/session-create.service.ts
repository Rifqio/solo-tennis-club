import type { PrismaClient, Prisma } from '../../../generated/prisma/client.ts'
import type { SessionInput, AdminSessionDetail, CreateSessionResponse } from '../../../../shared/api/admin-sessions.ts'
import type { FieldErrorCode } from '../../../../shared/api/errors.ts'
import { clubDateOf, clubTimeOf, clubDateTimeToInstant } from '../../../../shared/club-time.ts'
import { getOccupiedPlaceCounts } from '../../capacity/occupancy.ts'
import { ApiError } from '../../../http/errors.ts'
export const detailInclude = { class: true, level: true, venue: true, coaches: { include: { coach: true }, orderBy: { position: 'asc' as const } } } satisfies Prisma.ClassSessionInclude
type DetailRecord = Prisma.ClassSessionGetPayload<{ include: typeof detailInclude }>
export function toAdminSessionDetail(row: DetailRecord, occupied = 0): AdminSessionDetail {
  return { id: row.id, version: row.version, classId: row.classId, className: row.class.name, date: clubDateOf(row.startsAt), startTime: clubTimeOf(row.startsAt), endTime: clubTimeOf(new Date(row.startsAt.getTime() + row.durationMinutes * 60000)), startsAt: row.startsAt.toISOString(), durationMinutes: row.durationMinutes, levelId: row.levelId, levelName: row.level.name, venueId: row.venueId, venueName: row.venue.name, coaches: row.coaches.map(link => ({ id: link.coach.id, name: link.coach.name })), priceIdr: row.priceIdr, minParticipants: row.minParticipants, maxParticipants: row.maxParticipants, remainingPlaces: Math.max(0, row.maxParticipants - occupied), status: row.status, isSample: row.isSample }
}
export async function createSession(prisma: PrismaClient, input: SessionInput, adminId: string, now = new Date(), occupancy = getOccupiedPlaceCounts): Promise<CreateSessionResponse> {
  void now
  return prisma.$transaction(async tx => {
    const fields: Record<string, FieldErrorCode> = {}
    if (!await tx.tennisClass.findUnique({ where: { id: input.classId } })) fields.classId = 'REFERENCE_NOT_FOUND'
    if (!await tx.level.findUnique({ where: { id: input.levelId } })) fields.levelId = 'REFERENCE_NOT_FOUND'
    if (!await tx.venue.findUnique({ where: { id: input.venueId } })) fields.venueId = 'REFERENCE_NOT_FOUND'
    if (await tx.coach.count({ where: { id: { in: input.coachIds } } }) !== input.coachIds.length) fields.coachIds = 'REFERENCE_NOT_FOUND'
    if (Object.keys(fields).length) throw new ApiError(400, 'VALIDATION_FAILED', fields)
    const row = await tx.classSession.create({ data: { classId: input.classId, levelId: input.levelId, venueId: input.venueId, startsAt: clubDateTimeToInstant(input.date, input.startTime), durationMinutes: input.durationMinutes, priceIdr: input.priceIdr, minParticipants: input.minParticipants, maxParticipants: input.maxParticipants, createRequestId: input.createRequestId, createdById: adminId, updatedById: adminId, coaches: { create: input.coachIds.map((coachId, position) => ({ coachId, position })) } }, include: detailInclude })
    const occupied = await occupancy(tx, [row.id])
    return { session: toAdminSessionDetail(row, occupied.get(row.id) ?? 0), replayed: false }
  })
}
