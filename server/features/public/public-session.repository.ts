import type { Prisma } from '../../generated/prisma/client.ts'
import type { Database } from '../../database/transaction.ts'

const summaryFields = {
  id: true,
  version: true,
  startsAt: true,
  durationMinutes: true,
  priceIdr: true,
  maxParticipants: true,
  status: true,
  isSample: true,
  class: { select: { name: true, isSample: true } },
  level: { select: { name: true, isSample: true } },
  venue: { select: { name: true, isSample: true } },
  coaches: { select: { coach: { select: { isSample: true } } } },
} satisfies Prisma.ClassSessionSelect

export type PublicSummaryRow = Prisma.ClassSessionGetPayload<{ select: typeof summaryFields }>

export function createPublicSessionRepository(database: Database) {
  return {
    listInRange(start: Date, end: Date) {
      return database.classSession.findMany({
        where: { startsAt: { gte: start, lt: end } },
        select: summaryFields,
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      })
    },
    findNextStart(start: Date, end: Date) {
      return database.classSession.findFirst({
        where: { startsAt: { gte: start, lt: end } },
        select: { startsAt: true },
        orderBy: { startsAt: 'asc' },
      })
    },
    findDetailById(id: string) {
      return database.classSession.findUnique({
        where: { id },
        select: {
          ...summaryFields,
          minParticipants: true,
          venue: { select: { name: true, address: true, isSample: true } },
          coaches: {
            orderBy: { position: 'asc' },
            select: { coach: { select: { name: true, isSample: true } } },
          },
        },
      })
    },
  }
}
