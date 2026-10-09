import type { PrismaClient, Prisma } from '../../generated/prisma/client.ts'

export async function getOccupiedPlaceCounts(db: PrismaClient | Prisma.TransactionClient, sessionIds: string[], now = new Date()): Promise<Map<string, number>> {
  const counts = new Map(sessionIds.map(id => [id, 0]))
  if (!sessionIds.length) return counts
  const participants = await db.bookingParticipant.findMany({
    where: { booking: { sessionId: { in: sessionIds }, status: 'awaiting_payment', originalDeadline: { gt: now } } },
    select: { booking: { select: { sessionId: true } } },
  })
  for (const participant of participants) {
    const sessionId = participant.booking.sessionId
    counts.set(sessionId, (counts.get(sessionId) ?? 0) + 1)
  }
  return counts
}
