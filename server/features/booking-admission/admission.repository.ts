import type { Prisma } from '../../generated/prisma/client.ts'
import type { Database } from '../../database/transaction.ts'
import { activeBookingWhere } from '../capacity/occupancy.ts'

export type ActorKind = 'customer' | 'admin'

const bookingFields = { participants: { orderBy: { position: 'asc' } } } satisfies Prisma.BookingInclude

export type AdmittedBookingRow = Prisma.BookingGetPayload<{ include: typeof bookingFields }>

export function createAdmissionRepository(database: Database) {
  return {
    findSessionQuote(sessionId: string) {
      return database.classSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true, startsAt: true, durationMinutes: true, priceIdr: true, maxParticipants: true, status: true, version: true,
          class: { select: { name: true } }, level: { select: { name: true } }, venue: { select: { name: true } },
        },
      })
    },
    // The first statement of every admission: taking SQLite's write lock before capacity is read, so two admissions
    // for the same session can never both read the same free places.
    acquireSessionCapacityWrite(sessionId: string) {
      return database.classSession.updateMany({ where: { id: sessionId }, data: { capacityRevision: { increment: 1 } } })
    },
    findSession(sessionId: string) {
      return database.classSession.findUnique({ where: { id: sessionId } })
    },
    occupiedPlaces(sessionId: string, now: Date) {
      return database.bookingParticipant.count({ where: { booking: { sessionId, ...activeBookingWhere(now) } } })
    },
    findByRequestId(actorKind: ActorKind, actorId: string, requestId: string) {
      return database.booking.findUnique({
        where: { actorKind_actorId_createRequestId: { actorKind, actorId, createRequestId: requestId } },
        include: bookingFields,
      })
    },
    create(data: Prisma.BookingUncheckedCreateInput, names: string[]) {
      return database.booking.create({
        data: { ...data, participants: { create: names.map((name, index) => ({ name, position: index + 1 })) } },
        include: bookingFields,
      })
    },
  }
}
