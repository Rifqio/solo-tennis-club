import type { PrismaClient, Prisma } from '../../generated/prisma/client.ts'

// Phase 1 has no bookings. Phase 2 counts places here using the caller's transaction client.
export async function getOccupiedPlaceCounts(_db: PrismaClient | Prisma.TransactionClient, sessionIds: string[]): Promise<Map<string, number>> {
  return new Map(sessionIds.map(id => [id, 0]))
}
