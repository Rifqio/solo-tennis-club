import type { PrismaClient } from '../../generated/prisma/client.ts'
import { inTransaction } from '../../database/transaction.ts'
import { ApiError } from '../../http/errors.ts'
import { getOccupiedPlaceCounts } from '../capacity/occupancy.ts'
import { toPublicSessionSummary } from './schedule.service.ts'
import { createPublicSessionRepository } from './public-session.repository.ts'
import type { PublicSessionDetail } from '../../../shared/api/public.ts'

export async function getPublicSessionDetail(database: PrismaClient, id: string): Promise<PublicSessionDetail> {
  if (!/^[a-z0-9]{1,64}$/.test(id)) throw new ApiError(404, 'NOT_FOUND')
  return inTransaction(database, async transaction => {
    const row = await createPublicSessionRepository(transaction).findDetailById(id)
    if (!row) throw new ApiError(404, 'NOT_FOUND')
    const occupied = await getOccupiedPlaceCounts(transaction, [id])
    return {
      ...toPublicSessionSummary(row, occupied.get(id) ?? 0),
      version: row.version,
      venueAddress: row.venue.address,
      venueMapUrl: row.venue.mapUrl,
      coaches: row.coaches.map(link => link.coach.name),
      minParticipants: row.minParticipants,
      maxParticipants: row.maxParticipants,
      durationMinutes: row.durationMinutes,
    }
  })
}
