import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { inTransaction } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import { getOccupiedPlaceCounts } from '../../capacity/occupancy.ts'
import { createSessionRepository } from './session.repository.ts'
import { toAdminSessionDetail } from './session.mapper.ts'

export async function getAdminSession(database: PrismaClient, id: string) {
  return inTransaction(database, async transaction => {
    const row = await createSessionRepository(transaction).findById(id)
    if (!row) throw new ApiError(404, 'NOT_FOUND')
    const counts = await getOccupiedPlaceCounts(transaction, [id])
    return toAdminSessionDetail(row, counts.get(id) ?? 0)
  })
}
