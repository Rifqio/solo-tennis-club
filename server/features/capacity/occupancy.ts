import type { PrismaClient, Prisma } from '../../generated/prisma/client.ts'
import { DEADLINE_BOUND_STATUSES, STANDING_STATUSES } from '../../../shared/booking-rules.ts'

// Which bookings hold their places right now (shared/booking-rules.ts): a booking waiting for payment or for a
// corrected proof until its original deadline, and one whose proof awaits review or that is paid whatever the time.
// Capacity counts, rosters, admission and the player names shown to members all use this one rule.
export function activeBookingWhere(now: Date) {
  return {
    OR: [
      { status: { in: [...DEADLINE_BOUND_STATUSES] }, originalDeadline: { gt: now } },
      { status: { in: [...STANDING_STATUSES] } },
    ],
  } satisfies Prisma.BookingWhereInput
}

// Bookings that still owe payment and can still pay: unpaid or awaiting a corrected proof, before the original
// deadline. Narrower than activeBookingWhere, which also counts proofs under review and paid bookings.
export function awaitingPaymentWhere(now: Date) {
  return { status: { in: [...DEADLINE_BOUND_STATUSES] }, originalDeadline: { gt: now } } satisfies Prisma.BookingWhereInput
}

export async function getOccupiedPlaceCounts(db: PrismaClient | Prisma.TransactionClient, sessionIds: string[], now = new Date()): Promise<Map<string, number>> {
  const counts = new Map(sessionIds.map(id => [id, 0]))
  if (!sessionIds.length) return counts
  const participants = await db.bookingParticipant.findMany({
    where: { booking: { sessionId: { in: sessionIds }, ...activeBookingWhere(now) } },
    select: { booking: { select: { sessionId: true } } },
  })
  for (const participant of participants) {
    const sessionId = participant.booking.sessionId
    counts.set(sessionId, (counts.get(sessionId) ?? 0) + 1)
  }
  return counts
}
