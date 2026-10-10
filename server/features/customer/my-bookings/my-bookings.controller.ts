import type { Request, RequestHandler } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { parseCookies } from '../../../auth/cookie.ts'
import { ApiError } from '../../../http/errors.ts'
import { isOpaqueToken, requireCustomerSession } from '../auth/customer-session.service.ts'
import { CUSTOMER_COOKIE } from '../auth/customer-cookie.ts'
import { getMyBooking, HISTORY_DEFAULT, HISTORY_MAX, listMyBookings } from './my-bookings.service.ts'

const listQuery = z.object({
  view: z.enum(['upcoming', 'history']).default('upcoming'),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(HISTORY_MAX).default(HISTORY_DEFAULT),
})

function customerToken(request: Request) {
  const token = parseCookies(request.headers.cookie)[CUSTOMER_COOKIE] ?? ''
  return isOpaqueToken(token) ? token : ''
}

export function createMyBookingsController(database: PrismaClient, clock = () => new Date()) {
  const list: RequestHandler = async (request, response) => {
    const now = clock()
    const session = await requireCustomerSession(database, customerToken(request), now)
    const query = listQuery.safeParse(request.query)
    if (!query.success) throw new ApiError(400, 'VALIDATION_FAILED', { [String(query.error.issues[0]?.path[0] ?? 'query')]: 'INVALID_FORMAT' })
    response.json(await listMyBookings(database, session.customer.id, { view: query.data.view, cursor: query.data.cursor ?? null, limit: query.data.limit }, now))
  }
  const detail: RequestHandler<{ id: string }> = async (request, response) => {
    const now = clock()
    const session = await requireCustomerSession(database, customerToken(request), now)
    response.json(await getMyBooking(database, session.customer.id, request.params.id, now))
  }
  return { list, detail }
}
