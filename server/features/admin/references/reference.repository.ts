import type { Database } from '../../../database/transaction.ts'
import type { ReferenceKind } from '../../../../shared/api/admin-references.ts'

type ReferenceData = {
  name: string
  nameKey: string
  address?: string | null
  createRequestId?: string
}

export function createReferenceRepository(database: Database, kind: ReferenceKind) {
  return {
    list() {
      const orderBy = [{ nameKey: 'asc' as const }, { id: 'asc' as const }]
      switch (kind) {
        case 'coach': return database.coach.findMany({ orderBy })
        case 'venue': return database.venue.findMany({ orderBy })
        case 'level': return database.level.findMany({ orderBy })
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
