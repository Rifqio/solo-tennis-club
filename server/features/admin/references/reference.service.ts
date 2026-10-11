import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { ReferenceCounts, ReferenceKind, ReferenceInput, ReferenceRecord, ReferenceUsage } from '../../../../shared/api/admin-references.ts'
import { validateReferenceFields, toNameKey } from '../../../../shared/reference-rules.ts'
import { inTransaction, isUniqueConstraintError, type Database } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import type { PagedList } from '../../../../shared/api/admin-list.ts'
import { encodeNameCursor, type NamePageQuery } from '../listing/name-page.ts'
import { createReferenceRepository } from './reference.repository.ts'
import { createClassRepository } from '../classes/class.repository.ts'

type ReferenceRow = {
  id: string
  name: string
  version: number
  isSample: boolean
  address?: string | null
  mapUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  photoUrl?: string | null
  archivedAt?: Date | null
}

function toReferenceRecord(kind: ReferenceKind, row: ReferenceRow, classCount = 0): ReferenceRecord {
  return {
    id: row.id,
    kind,
    name: row.name,
    address: row.address ?? null,
    mapUrl: row.mapUrl ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    photoUrl: row.photoUrl ?? null,
    classCount,
    archived: row.archivedAt != null,
    version: row.version,
    isSample: row.isSample,
  }
}

// A venue keeps its Maps link only together with the pin it points at.
function venueFields(input: ReferenceInput) {
  const mapUrl = input.mapUrl?.trim() || null
  return {
    address: input.address?.trim() || null,
    mapUrl,
    latitude: mapUrl ? input.latitude ?? null : null,
    longitude: mapUrl ? input.longitude ?? null : null,
  }
}

// `archived`: the archive list instead of the active one.
export async function listReferencePage(database: Database, kind: ReferenceKind, query: NamePageQuery, archived = false): Promise<PagedList<ReferenceRecord>> {
  const repository = createReferenceRepository(database, kind)
  const [rows, total] = await Promise.all([repository.listPage(query.search, query.after, query.limit + 1, archived), repository.count(query.search, archived)])
  const page = rows.slice(0, query.limit)
  const counts = await repository.classCounts(page.map(row => row.id))
  const last = page.at(-1)
  return { items: page.map(row => toReferenceRecord(kind, row, counts.get(row.id) ?? 0)), nextCursor: rows.length > query.limit && last ? encodeNameCursor(last) : null, total }
}

export async function getReference(database: Database, kind: ReferenceKind, id: string): Promise<ReferenceRecord> {
  const repository = createReferenceRepository(database, kind)
  const row = await repository.findById(id)
  if (!row) throw new ApiError(404, 'NOT_FOUND')
  return toReferenceRecord(kind, row, (await repository.classCounts([id])).get(id) ?? 0)
}

export async function getReferenceUsage(database: Database, kind: ReferenceKind, id: string, now = new Date()): Promise<ReferenceUsage> {
  const repository = createReferenceRepository(database, kind)
  if (!(await repository.findById(id))) throw new ApiError(404, 'NOT_FOUND')
  const classes = await repository.usage(id, now)
  return {
    classes: classes.map(row => ({
      id: row.id, name: row.name, levelName: row.defaultLevel.name, venueName: row.defaultVenue.name,
      durationMinutes: row.defaultDurationMinutes, nextSessionAt: row.sessions[0]?.startsAt.toISOString() ?? null,
    })),
  }
}

// Archive (or restore) a record with the version the admin saw; a newer version answers 409 with the latest.
export async function setReferenceArchived(database: PrismaClient, kind: ReferenceKind, id: string, version: number, archived: boolean, now = new Date()): Promise<ReferenceRecord> {
  return inTransaction(database, async transaction => {
    const current = await getReference(transaction, kind, id)
    if (current.version !== version) throw new ApiError(409, 'STALE_VERSION', undefined, current)
    const changed = await createReferenceRepository(transaction, kind).setArchivedIfVersionMatches(id, version, archived ? now : null)
    if (!changed) throw new ApiError(409, 'STALE_VERSION', undefined, await getReference(transaction, kind, id))
    return getReference(transaction, kind, id)
  })
}

export async function getReferenceCounts(database: Database): Promise<ReferenceCounts> {
  const [coach, venue, level] = await Promise.all((['coach', 'venue', 'level'] as const).map(kind => createReferenceRepository(database, kind).countActive()))
  // Kelas sits beside the three lists as a tab on phones (Kelola), so its count travels with them.
  const classes = await createClassRepository(database).count('')
  return { coach, venue, level, classes }
}

export async function saveReference(
  database: PrismaClient,
  kind: ReferenceKind,
  input: ReferenceInput,
  id?: string,
): Promise<ReferenceRecord> {
  const fields = validateReferenceFields(kind, { ...input })
  if (Object.keys(fields).length) throw new ApiError(400, 'VALIDATION_FAILED', fields)

  try {
    return await inTransaction(database, async transaction => {
      const repository = createReferenceRepository(transaction, kind)
      if (!id && input.createRequestId) {
        const replay = await repository.findByRequestId(input.createRequestId)
        if (replay) return toReferenceRecord(kind, replay)
      }

      const data = {
        name: input.name.trim().replace(/\s+/g, ' '),
        nameKey: toNameKey(input.name),
        ...(kind === 'venue' ? venueFields(input) : {}),
      }
      if (!id) {
        const created = await repository.create({ ...data, createRequestId: input.createRequestId })
        return toReferenceRecord(kind, created)
      }

      const current = await getReference(transaction, kind, id)
      if (current.version !== input.version) {
        throw new ApiError(409, 'STALE_VERSION', undefined, current)
      }
      const changed = await repository.updateIfVersionMatches(id, input.version, data)
      if (!changed) {
        throw new ApiError(409, 'STALE_VERSION', undefined, await getReference(transaction, kind, id))
      }
      return getReference(transaction, kind, id)
    })
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error
    if (!id && input.createRequestId) {
      const replay = await createReferenceRepository(database, kind).findByRequestId(input.createRequestId)
      if (replay) return toReferenceRecord(kind, replay)
    }
    throw new ApiError(409, 'DUPLICATE_NAME', { name: 'DUPLICATE_NAME' })
  }
}
