import type { PrismaClient, Prisma } from '../../../generated/prisma/client.ts'
import type { UpdateSessionInput } from '../../../../shared/api/admin-sessions.ts'
import type { FieldErrorCode } from '../../../../shared/api/errors.ts'
import { validateSessionFields } from '../../../../shared/session-rules.ts'
import { clubDateTimeToInstant, clubDateOf, clubTimeOf, clubToday } from '../../../../shared/club-time.ts'
import { inWriteTransaction } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import { getOccupiedPlaceCounts } from '../../capacity/occupancy.ts'
import { createSessionRepository } from './session.repository.ts'
import { toAdminSessionDetail } from './session.mapper.ts'
import { validateSessionReferences } from './session-reference.service.ts'

type CoachWriter = (transaction: Prisma.TransactionClient, id: string, coachIds: string[]) => Promise<void>

const writeCoaches: CoachWriter = async (transaction, sessionId, coachIds) => {
  await createSessionRepository(transaction).addCoaches(sessionId, coachIds)
}

export async function updateSession(
  database: PrismaClient,
  id: string,
  input: UpdateSessionInput,
  adminId: string,
  now = new Date(),
  occupancy = getOccupiedPlaceCounts,
  coachWriter: CoachWriter = writeCoaches,
) {
  return inWriteTransaction(database, async transaction => {
    const repository = createSessionRepository(transaction)
    const acquired = await repository.acquireCapacityWrite(id)
    if (!acquired.count) throw new ApiError(404, 'NOT_FOUND')
    const current = await repository.findById(id)
    if (!current) throw new ApiError(404, 'NOT_FOUND')

    const occupiedPlaces = (await occupancy(transaction, [id])).get(id) ?? 0
    if (current.version !== input.version) {
      throw new ApiError(409, 'STALE_VERSION', undefined, toAdminSessionDetail(current, occupiedPlaces))
    }

    const fields = validateSessionFields({ ...input }, { today: clubToday(now), now }) as Record<string, FieldErrorCode>
    const timeUnchanged = input.date === clubDateOf(current.startsAt) && input.startTime === clubTimeOf(current.startsAt)
    if (timeUnchanged) {
      delete fields.date
      delete fields.startTime
    }
    if (Number.isSafeInteger(input.maxParticipants) && input.maxParticipants < occupiedPlaces) {
      fields.maxParticipants = 'CAPACITY_BELOW_OCCUPIED'
    }
    if (Object.keys(fields).length) throw new ApiError(400, 'VALIDATION_FAILED', fields)

    await validateSessionReferences(transaction, input)
    const changed = await repository.updateIfVersionMatches(id, input.version, {
      classId: input.classId,
      levelId: input.levelId,
      venueId: input.venueId,
      startsAt: clubDateTimeToInstant(input.date, input.startTime),
      durationMinutes: input.durationMinutes,
      priceIdr: input.priceIdr,
      minParticipants: input.minParticipants,
      maxParticipants: input.maxParticipants,
      version: { increment: 1 },
      updatedById: adminId,
    })
    if (!changed) {
      const latest = await repository.requireById(id)
      throw new ApiError(409, 'STALE_VERSION', undefined, toAdminSessionDetail(latest, occupiedPlaces))
    }

    await repository.deleteCoaches(id)
    await coachWriter(transaction, id, input.coachIds)
    return toAdminSessionDetail(await repository.requireById(id), occupiedPlaces)
  })
}
