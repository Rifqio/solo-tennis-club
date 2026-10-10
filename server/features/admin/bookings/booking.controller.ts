import type { RequestHandler } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { ApiError } from '../../../http/errors.ts'
import { getAdminBooking, LIST_DEFAULT, LIST_MAX, listAdminBookings } from './booking.service.ts'

const listQuery = z.object({
  status: z.enum(['unpaid', 'confirmed', 'all']).default('unpaid'),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(LIST_MAX).default(LIST_DEFAULT),
})

export function createAdminBookingController(database: PrismaClient) {
  const list: RequestHandler = async (request, response) => {
    const query = listQuery.safeParse(request.query)
    if (!query.success) throw new ApiError(400, 'VALIDATION_FAILED', { [String(query.error.issues[0]?.path[0] ?? 'query')]: 'INVALID_FORMAT' })
    response.json(await listAdminBookings(database, { filter: query.data.status, cursor: query.data.cursor ?? null, limit: query.data.limit }))
  }
  const detail: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await getAdminBooking(database, request.params.id))
  }
  return { list, detail }
}
