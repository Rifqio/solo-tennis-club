import type { Database } from '../../../database/transaction.ts'
import type { ReferenceKind } from '../../../../shared/api/admin-references.ts'
import { nameAfterWhere, nameOrder, nameSearchWhere, type NameCursor } from '../listing/name-page.ts'

type ReferenceData = {
  name: string
  nameKey: string
  address?: string | null
  mapUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  createRequestId?: string
}

export function createReferenceRepository(database: Database, kind: ReferenceKind) {
  return {
    // One page in name order: matches for the search, after the cursor row.
    listPage(search: string, after: NameCursor | null, take: number) {
      const where = { AND: [nameSearchWhere(search), nameAfterWhere(after)] }
      switch (kind) {
        case 'coach': return database.coach.findMany({ where, orderBy: nameOrder, take })
        case 'venue': return database.venue.findMany({ where, orderBy: nameOrder, take })
        case 'level': return database.level.findMany({ where, orderBy: nameOrder, take })
      }
    },
    count(search: string) {
      const where = nameSearchWhere(search)
      switch (kind) {
        case 'coach': return database.coach.count({ where })
        case 'venue': return database.venue.count({ where })
        case 'level': return database.level.count({ where })
      }
    },
    findById(id: string) {
      switch (kind) {
        case 'coach': return database.coach.findUnique({ where: { id } })
        case 'venue': return database.venue.findUnique({ where: { id } })
        case 'level': return database.level.findUnique({ where: { id } })
      }
    },
    findByRequestId(createRequestId: string) {
      switch (kind) {
        case 'coach': return database.coach.findUnique({ where: { createRequestId } })
        case 'venue': return database.venue.findUnique({ where: { createRequestId } })
        case 'level': return database.level.findUnique({ where: { createRequestId } })
      }
    },
    create(data: ReferenceData) {
      switch (kind) {
        case 'coach': return database.coach.create({ data })
        case 'venue': return database.venue.create({ data })
        case 'level': return database.level.create({ data })
      }
    },
    async updateIfVersionMatches(id: string, version: number | undefined, changes: ReferenceData) {
      const args = { where: { id, version }, data: { ...changes, version: { increment: 1 } } }
      let result
      switch (kind) {
        case 'coach': result = await database.coach.updateMany(args); break
        case 'venue': result = await database.venue.updateMany(args); break
        case 'level': result = await database.level.updateMany(args); break
      }
      return result.count > 0
    },
    countByIds(ids: string[]) {
      const where = { id: { in: ids } }
      switch (kind) {
        case 'coach': return database.coach.count({ where })
        case 'venue': return database.venue.count({ where })
        case 'level': return database.level.count({ where })
      }
    },
  }
}
