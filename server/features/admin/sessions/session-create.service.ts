import type { PrismaClient, Prisma } from '../../../generated/prisma/client.ts'
import type { SessionInput, CreateSessionResponse } from '../../../../shared/api/admin-sessions.ts'
import type { FieldErrorCode } from '../../../../shared/api/errors.ts'
import { clubDateTimeToInstant, clubToday } from '../../../../shared/club-time.ts'
import { validateSessionFields } from '../../../../shared/session-rules.ts'
import { inTransaction, isUniqueConstraintError, type Database } from '../../../database/transaction.ts'
import { getOccupiedPlaceCounts } from '../../capacity/occupancy.ts'
import { ApiError } from '../../../http/errors.ts'
import { createSessionRepository, type SessionRow } from './session.repository.ts'
import { toAdminSessionDetail } from './session.mapper.ts'
import { validateSessionReferences } from './session-reference.service.ts'

type CoachWriter = (transaction: Prisma.TransactionClient, sessionId: string, coachIds: string[]) => Promise<void>

const writeCoaches: CoachWriter = async (transaction, sessionId, coachIds) => {
  await createSessionRepository(transaction).addCoaches(sessionId, coachIds)
}

export async function createSession(
  database: PrismaClient,
  input: SessionInput,
  adminId: string,
  now = new Date(),
  occupancy = getOccupiedPlaceCounts,
  coachWriter: CoachWriter = writeCoaches,
): Promise<CreateSessionResponse> {
  async function toResponse(source: Database, row: SessionRow, replayed: boolean): Promise<CreateSessionResponse> {
    const occupied = await occupancy(source, [row.id])
    return { session: toAdminSessionDetail(row, occupied.get(row.id) ?? 0), replayed }
  }

  const existing = await createSessionRepository(database).findByRequestId(input.createRequestId)
  if (existing) return toResponse(database, existing, true)

  const fields = validateSessionFields({ ...input }, { today: clubToday(now), now })
  if (Object.keys(fields).length) {
    throw new ApiError(400, 'VALIDATION_FAILED', fields as Record<string, FieldErrorCode>)
  }

  try {
    return await inTransaction(database, async transaction => {
      const repository = createSessionRepository(transaction)
      // Another request may have created the same session while this transaction waited.
      const winner = await repository.findByRequestId(input.createRequestId)
      if (winner) return toResponse(transaction, winner, true)

      await validateSessionReferences(transaction, input)
      const inserted = await repository.create({
        classId: input.classId,
        levelId: input.levelId,
        venueId: input.venueId,
        startsAt: clubDateTimeToInstant(input.date, input.startTime),
        durationMinutes: input.durationMinutes,
        priceIdr: input.priceIdr,
        minParticipants: input.minParticipants,
        maxParticipants: input.maxParticipants,
        createRequestId: input.createRequestId,
        createdById: adminId,
        updatedById: adminId,
      })
      await coachWriter(transaction, inserted.id, input.coachIds)
      const row = await repository.requireById(inserted.id)
      return toResponse(transaction, row, false)
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const winner = await createSessionRepository(database).findByRequestId(input.createRequestId)
      if (winner) return toResponse(database, winner, true)
    }
    throw error
  }
}
