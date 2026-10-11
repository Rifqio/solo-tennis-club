import type { PrismaClient, Prisma } from '../../../generated/prisma/client.ts'
import type { ClassInput, ClassRecord } from '../../../../shared/api/admin-classes.ts'
import type { FieldErrorCode } from '../../../../shared/api/errors.ts'
import { validateClassFields } from '../../../../shared/class-rules.ts'
import { toNameKey } from '../../../../shared/reference-rules.ts'
import { inTransaction, isUniqueConstraintError, type Database } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import type { PagedList } from '../../../../shared/api/admin-list.ts'
import { encodeNameCursor, type NamePageQuery } from '../listing/name-page.ts'
import { createClassRepository, type ClassRow } from './class.repository.ts'
import { createReferenceRepository } from '../references/reference.repository.ts'

export function toClassRecord(row: ClassRow): ClassRecord {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    isSample: row.isSample || row.defaultLevel.isSample || row.defaultVenue.isSample
      || row.defaultCoaches.some(link => link.coach.isSample),
    defaultLevelId: row.defaultLevelId,
    defaultVenueId: row.defaultVenueId,
    defaultDurationMinutes: row.defaultDurationMinutes,
    defaultPriceIdr: row.defaultPriceIdr,
    defaultMinParticipants: row.defaultMinParticipants,
    defaultMaxParticipants: row.defaultMaxParticipants,
    defaultCoachIds: row.defaultCoaches.map(link => link.coachId),
    levelName: row.defaultLevel.name,
    venueName: row.defaultVenue.name,
    coaches: row.defaultCoaches.map(link => ({ id: link.coach.id, name: link.coach.name, photoUrl: link.coach.photoUrl ?? null })),
  }
}

export async function getClass(database: Database, id: string): Promise<ClassRecord> {
  const row = await createClassRepository(database).findById(id)
  if (!row) throw new ApiError(404, 'NOT_FOUND')
  return toClassRecord(row)
}

export async function listClassPage(database: PrismaClient, query: NamePageQuery): Promise<PagedList<ClassRecord>> {
  const repository = createClassRepository(database)
  const [rows, total] = await Promise.all([repository.listPage(query.search, query.after, query.limit + 1), repository.count(query.search)])
  const page = rows.slice(0, query.limit)
  const last = page.at(-1)
  return { items: page.map(toClassRecord), nextCursor: rows.length > query.limit && last ? encodeNameCursor(last) : null, total }
}

async function validateDefaultReferences(database: Database, input: ClassInput) {
  const errors: Record<string, FieldErrorCode> = {}
  const levels = createReferenceRepository(database, 'level')
  const venues = createReferenceRepository(database, 'venue')
  const coaches = createReferenceRepository(database, 'coach')

  if (!await levels.findById(input.defaultLevelId)) errors.defaultLevelId = 'REFERENCE_NOT_FOUND'
  if (!await venues.findById(input.defaultVenueId)) errors.defaultVenueId = 'REFERENCE_NOT_FOUND'
  if (await coaches.countByIds(input.defaultCoachIds) !== input.defaultCoachIds.length) {
    errors.defaultCoachIds = 'REFERENCE_NOT_FOUND'
  }
  if (Object.keys(errors).length) throw new ApiError(400, 'VALIDATION_FAILED', errors)
}

type CoachWriter = (transaction: Prisma.TransactionClient, classId: string, coachIds: string[]) => Promise<void>

const writeCoaches: CoachWriter = async (transaction, classId, coachIds) => {
  await createClassRepository(transaction).addCoaches(classId, coachIds)
}

export async function saveClass(
  database: PrismaClient,
  input: ClassInput,
  id?: string,
  coachWriter: CoachWriter = writeCoaches,
): Promise<ClassRecord> {
  const fields = validateClassFields({ ...input })
  if (Object.keys(fields).length) throw new ApiError(400, 'VALIDATION_FAILED', fields)

  try {
    return await inTransaction(database, async transaction => {
      const repository = createClassRepository(transaction)
      if (!id && input.createRequestId) {
        const replay = await repository.findByRequestId(input.createRequestId)
        if (replay) return toClassRecord(replay)
      }
      if (id) {
        const current = await getClass(transaction, id)
        if (current.version !== input.version) {
          throw new ApiError(409, 'STALE_VERSION', undefined, current)
        }
      }

      await validateDefaultReferences(transaction, input)
      const data = {
        name: input.name.trim().replace(/\s+/g, ' '),
        nameKey: toNameKey(input.name),
        defaultLevelId: input.defaultLevelId,
        defaultVenueId: input.defaultVenueId,
        defaultDurationMinutes: input.defaultDurationMinutes,
        defaultPriceIdr: input.defaultPriceIdr,
        defaultMinParticipants: input.defaultMinParticipants,
        defaultMaxParticipants: input.defaultMaxParticipants,
      }

      let classId: string
      if (id) {
        const changed = await repository.updateIfVersionMatches(id, input.version, {
          ...data,
          version: { increment: 1 },
        })
        if (!changed) {
          throw new ApiError(409, 'STALE_VERSION', undefined, await getClass(transaction, id))
        }
        classId = id
        await repository.deleteCoaches(classId)
      } else {
        const created = await repository.create({ ...data, createRequestId: input.createRequestId })
        classId = created.id
      }

      await coachWriter(transaction, classId, input.defaultCoachIds)
      return getClass(transaction, classId)
    })
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error
    if (!id && input.createRequestId) {
      const replay = await createClassRepository(database).findByRequestId(input.createRequestId)
      if (replay) return toClassRecord(replay)
    }
    throw new ApiError(409, 'DUPLICATE_NAME', { name: 'DUPLICATE_NAME' })
  }
}
