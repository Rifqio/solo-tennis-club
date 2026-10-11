import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { ApiError } from '../../../http/errors.ts'
import { createRosterRepository } from './roster.repository.ts'
import { effectiveBookingStatus } from '../../../../shared/booking-rules.ts'

export async function getAdminRoster(database: PrismaClient, sessionId: string, now = new Date()) {
  const repository = createRosterRepository(database)
  const session = await repository.findSession(sessionId)
  if (!session) throw new ApiError(404, 'NOT_FOUND')
  const [rows, occupiedPlaces] = await Promise.all([
    repository.listBookings(sessionId),
    repository.countActivePlaces(sessionId, now),
  ])
  const bookings = rows.slice(0, 200).map(booking => {
    return {
      id: booking.id,
      bookerName: booking.bookerName,
      bookerPhone: booking.bookerPhone,
      quantity: booking.quantity,
      unitPriceIdr: booking.unitPriceIdr,
      totalPriceIdr: booking.totalPriceIdr,
      status: effectiveBookingStatus(booking.status, booking.originalDeadline, now),
      originalDeadline: booking.originalDeadline.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      participants: booking.participants.map(({ id, position, name }) => ({ id, position, name })),
    }
  })
  return {
    session: {
      id: session.id, className: session.class.name, levelName: session.level.name,
      date: session.startsAt.toISOString(), durationMinutes: session.durationMinutes,
      venueName: session.venue.name, venueAddress: session.venue.address,
      coaches: session.coaches.map(({ coach }) => coach.name),
      priceIdr: session.priceIdr, minParticipants: session.minParticipants, maxParticipants: session.maxParticipants,
      status: session.status,
    },
    bookings,
    occupiedPlaces,
    remainingPlaces: Math.max(0, session.maxParticipants - occupiedPlaces),
    serverNow: now.toISOString(),
    truncated: rows.length > 200,
  }
}
