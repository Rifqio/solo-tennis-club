import type { Prisma } from '../../../generated/prisma/client.ts'
import type { Database } from '../../../database/transaction.ts'

const classRelations = {
  defaultLevel: true,
  defaultVenue: true,
  defaultCoaches: {
    include: { coach: true },
    orderBy: { position: 'asc' as const },
  },
} satisfies Prisma.TennisClassInclude

export type ClassRow = Prisma.TennisClassGetPayload<{ include: typeof classRelations }>

export function createClassRepository(database: Database) {
  return {
    findById(id: string) {
      return database.tennisClass.findUnique({ where: { id }, include: classRelations })
    },
    findByRequestId(createRequestId: string) {
      return database.tennisClass.findUnique({ where: { createRequestId }, include: classRelations })
    },
    list() {
      return database.tennisClass.findMany({
        include: classRelations,
        orderBy: [{ nameKey: 'asc' }, { id: 'asc' }],
      })
    },
    create(data: Prisma.TennisClassUncheckedCreateInput) {
      return database.tennisClass.create({ data })
    },
    async updateIfVersionMatches(id: string, version: number | undefined, data: Prisma.TennisClassUncheckedUpdateManyInput) {
      const result = await database.tennisClass.updateMany({ where: { id, version }, data })
      return result.count > 0
    },
    deleteCoaches(classId: string) {
      return database.classDefaultCoach.deleteMany({ where: { classId } })
    },
    addCoaches(classId: string, coachIds: string[]) {
      return database.classDefaultCoach.createMany({
        data: coachIds.map((coachId, position) => ({ classId, coachId, position })),
      })
    },
  }
}
