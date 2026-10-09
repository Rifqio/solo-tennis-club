import type { Prisma } from '../../../generated/prisma/client.ts'
import type { Database } from '../../../database/transaction.ts'

const sessionRelations = {
  class: true,
  level: true,
  venue: true,
  coaches: { include: { coach: true }, orderBy: { position: 'asc' as const } },
} satisfies Prisma.ClassSessionInclude

export type SessionRow = Prisma.ClassSessionGetPayload<{ include: typeof sessionRelations }>

export function createSessionRepository(database: Database) {
  return {
    acquireCapacityWrite(id: string) {
      return database.classSession.updateMany({ where: { id }, data: { capacityRevision: { increment: 1 } } })
    },
    findById(id: string) {
      return database.classSession.findUnique({ where: { id }, include: sessionRelations })
    },
    requireById(id: string) {
      return database.classSession.findUniqueOrThrow({ where: { id }, include: sessionRelations })
    },
    findByRequestId(createRequestId: string) {
      return database.classSession.findUnique({ where: { createRequestId }, include: sessionRelations })
    },
    create(data: Prisma.ClassSessionUncheckedCreateInput) {
      return database.classSession.create({ data })
    },
    async updateIfVersionMatches(id: string, version: number, data: Prisma.ClassSessionUncheckedUpdateManyInput) {
      const result = await database.classSession.updateMany({ where: { id, version }, data })
      return result.count > 0
    },
    addCoaches(sessionId: string, coachIds: string[]) {
      return database.sessionCoach.createMany({
        data: coachIds.map((coachId, position) => ({ sessionId, coachId, position })),
      })
    },
    deleteCoaches(sessionId: string) {
      return database.sessionCoach.deleteMany({ where: { sessionId } })
    },
    listFrom(start: Date, end?: Date) {
      return database.classSession.findMany({
        where: { startsAt: { gte: start, ...(end ? { lt: end } : {}) } },
        include: sessionRelations,
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        take: 201,
      })
    },
    findNextStart(start: Date, end: Date) {
      return database.classSession.findFirst({
        where: { startsAt: { gte: start, lt: end } },
        select: { startsAt: true },
        orderBy: { startsAt: 'asc' },
      })
    },
    async getOptions() {
      const orderBy = [{ name: 'asc' as const }, { id: 'asc' as const }]
      const [classes, levels, venues, coaches] = await Promise.all([
        database.tennisClass.findMany({ orderBy, include: { defaultCoaches: { orderBy: { position: 'asc' } } } }),
        database.level.findMany({ orderBy, select: { id: true, name: true } }),
        database.venue.findMany({ orderBy, select: { id: true, name: true } }),
        database.coach.findMany({ orderBy, select: { id: true, name: true } }),
      ])
      return { classes, levels, venues, coaches }
    },
  }
}
