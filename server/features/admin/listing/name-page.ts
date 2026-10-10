import { z } from 'zod'
import { LIST_PAGE_MAX, LIST_PAGE_SIZE } from '../../../../shared/api/admin-list.ts'
import { toNameKey } from '../../../../shared/reference-rules.ts'
import { ApiError } from '../../../http/errors.ts'

// Query for a name-sorted admin list: an optional search, the cursor from the previous page, and a page size.
const listQuery = z.object({
  q: z.string().max(120).optional(),
  cursor: z.string().max(400).optional(),
  limit: z.coerce.number().int().min(1).max(LIST_PAGE_MAX).default(LIST_PAGE_SIZE),
})

export type NameCursor = { nameKey: string; id: string }
export type NamePageQuery = { search: string; after: NameCursor | null; limit: number }

export function parseNamePageQuery(query: unknown): NamePageQuery {
  const parsed = listQuery.safeParse(query)
  if (!parsed.success) throw new ApiError(400, 'VALIDATION_FAILED', { query: 'INVALID_FORMAT' })
  return { search: toNameKey(parsed.data.q ?? ''), after: parsed.data.cursor ? decodeNameCursor(parsed.data.cursor) : null, limit: parsed.data.limit }
}

export function encodeNameCursor(row: NameCursor) {
  return Buffer.from(JSON.stringify([row.nameKey, row.id])).toString('base64url')
}

function decodeNameCursor(cursor: string): NameCursor {
  try {
    const [nameKey, id] = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown[]
    if (typeof nameKey !== 'string' || nameKey.length > 300 || typeof id !== 'string' || !/^[a-z0-9]{1,64}$/.test(id)) throw new Error('bad cursor')
    return { nameKey, id }
  } catch {
    throw new ApiError(400, 'VALIDATION_FAILED', { cursor: 'INVALID_FORMAT' })
  }
}

// Prisma filters shared by every name-sorted list: the search (nameKey is already lower-cased and trimmed) and
// "after this row" in nameKey-then-id order. Works for any model with nameKey and id.
export function nameSearchWhere(search: string) {
  return search ? { nameKey: { contains: search } } : {}
}
export function nameAfterWhere(after: NameCursor | null) {
  return after ? { OR: [{ nameKey: { gt: after.nameKey } }, { nameKey: after.nameKey, id: { gt: after.id } }] } : {}
}
export const nameOrder = [{ nameKey: 'asc' as const }, { id: 'asc' as const }]
