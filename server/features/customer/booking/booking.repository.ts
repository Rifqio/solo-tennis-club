import type { Prisma } from '../../../generated/prisma/client.ts'
import type { Database } from '../../../database/transaction.ts'

export function createBookingRepository(database: Database) {
  return {
    findSessionOptions(sessionId: string) {
      return database.classSession.findUnique({ where: { id: sessionId }, select: { id: true, startsAt: true, priceIdr: true, maxParticipants: true, status: true, version: true } })
    },
    acquireSessionCapacityWrite(sessionId: string) {
      return database.classSession.updateMany({ where: { id: sessionId }, data: { capacityRevision: { increment: 1 } } })
    },
    findSession(sessionId: string) {
      return database.classSession.findUnique({ where: { id: sessionId } })
    },
    countActivePlaces(sessionId: string, now: Date) {
      return database.bookingParticipant.count({ where: { booking: { sessionId, status: 'awaiting_payment', originalDeadline: { gt: now } } } })
    },
    findByRequest(actorId: string, requestId: string) {
      return database.booking.findUnique({ where: { actorKind_actorId_createRequestId: { actorKind: 'customer', actorId, createRequestId: requestId } }, include: { participants: { orderBy: { position: 'asc' } } } })
    },
    create(data: Prisma.BookingUncheckedCreateInput, names: string[]) {
      return database.booking.create({ data: { ...data, participants: { create: names.map((name, index) => ({ name, position: index + 1 })) } }, include: { participants: { orderBy: { position: 'asc' } } } })
    },
  }
}
