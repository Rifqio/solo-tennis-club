import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { ReferenceKind, ReferenceInput, ReferenceRecord } from '../../../../shared/api/admin-references.ts'
import { validateReferenceFields, toNameKey } from '../../../../shared/reference-rules.ts'
import { inTransaction, isUniqueConstraintError, type Database } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import { createReferenceRepository } from './reference.repository.ts'

type ReferenceRow = {
  id: string
  name: string
  version: number
  isSample: boolean
  address?: string | null
  mapUrl?: string | null
  latitude?: number | null
  longitude?: number | null
}

function toReferenceRecord(kind: ReferenceKind, row: ReferenceRow): ReferenceRecord {
  return {
    id: row.id,
    kind,
    name: row.name,
    address: row.address ?? null,
    mapUrl: row.mapUrl ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
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

export async function listReferences(database: Database, kind: ReferenceKind): Promise<ReferenceRecord[]> {
  const rows = await createReferenceRepository(database, kind).list()
  return rows.map(row => toReferenceRecord(kind, row))
}

export async function getReference(database: Database, kind: ReferenceKind, id: string): Promise<ReferenceRecord> {
  const row = await createReferenceRepository(database, kind).findById(id)
  if (!row) throw new ApiError(404, 'NOT_FOUND')
  return toReferenceRecord(kind, row)
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
