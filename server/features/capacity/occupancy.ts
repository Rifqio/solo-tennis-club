import type { PrismaClient, Prisma } from '../../generated/prisma/client.ts'

// A booking holds its places while it awaits payment and its original deadline has not passed.
// Capacity counts and the player names shown to members both use this one rule.
export function activeBookingWhere(now: Date) {
  return { status: 'awaiting_payment', originalDeadline: { gt: now } } satisfies Prisma.BookingWhereInput
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
