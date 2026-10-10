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

// The class fields a usage list shows, with the class's next scheduled session.
const usageSelect = (now: Date) => ({
  id: true, name: true, defaultDurationMinutes: true,
  defaultLevel: { select: { name: true } }, defaultVenue: { select: { name: true } },
  sessions: { where: { status: 'scheduled', startsAt: { gt: now } }, orderBy: { startsAt: 'asc' as const }, take: 1, select: { startsAt: true } },
})

export function createReferenceRepository(database: Database, kind: ReferenceKind) {
  return {
    // One page in name order: matches for the search, after the cursor row, active or archived.
    listPage(search: string, after: NameCursor | null, take: number, archived = false) {
      const where = { AND: [nameSearchWhere(search), nameAfterWhere(after), { archivedAt: archived ? { not: null } : null }] }
      switch (kind) {
        case 'coach': return database.coach.findMany({ where, orderBy: nameOrder, take })
        case 'venue': return database.venue.findMany({ where, orderBy: nameOrder, take })
        case 'level': return database.level.findMany({ where, orderBy: nameOrder, take })
      }
    },
    count(search: string, archived = false) {
      const where = { ...nameSearchWhere(search), archivedAt: archived ? { not: null } : null }
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
    // How many classes use each record by default.
    async classCounts(ids: string[]): Promise<Map<string, number>> {
      if (!ids.length) return new Map()
      if (kind === 'coach') {
        const rows = await database.classDefaultCoach.groupBy({ by: ['coachId'], where: { coachId: { in: ids } }, _count: { _all: true } })
        return new Map(rows.map(row => [row.coachId, row._count._all]))
      }
      const field = kind === 'level' ? 'defaultLevelId' : 'defaultVenueId'
      const rows = await database.tennisClass.groupBy({ by: [field], where: { [field]: { in: ids } }, _count: { _all: true } })
      return new Map(rows.map(row => [(row as Record<string, unknown>)[field] as string, row._count._all]))
    },
    // The classes that use the record by default, in name order, each with its next scheduled session.
    usage(id: string, now: Date) {
      const where = kind === 'coach' ? { defaultCoaches: { some: { coachId: id } } } : kind === 'level' ? { defaultLevelId: id } : { defaultVenueId: id }
      return database.tennisClass.findMany({ where, orderBy: nameOrder, select: usageSelect(now) })
    },
    async setArchivedIfVersionMatches(id: string, version: number, archivedAt: Date | null) {
      const args = { where: { id, version }, data: { archivedAt, version: { increment: 1 } } }
      let result
      switch (kind) {
        case 'coach': result = await database.coach.updateMany(args); break
        case 'venue': result = await database.venue.updateMany(args); break
        case 'level': result = await database.level.updateMany(args); break
      }
      return result.count > 0
    },
    // Coaches only: the portrait path (or null), as a new version so open editors notice.
    setPhoto(id: string, photoUrl: string | null) {
      return database.coach.update({ where: { id }, data: { photoUrl, version: { increment: 1 } } })
    },
    countActive() {
      const where = { archivedAt: null }
      switch (kind) {
        case 'coach': return database.coach.count({ where })
        case 'venue': return database.venue.count({ where })
        case 'level': return database.level.count({ where })
      }
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
