import type { Request, RequestHandler } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { parseCookies } from '../../../auth/cookie.ts'
import { isClubDate } from '../../../../shared/club-time.ts'
import { ApiError } from '../../../http/errors.ts'
import { isOpaqueToken, requireCustomerSession } from '../auth/customer-session.service.ts'
import { CUSTOMER_COOKIE } from '../auth/customer-cookie.ts'
import { getSessionPlayers } from './players.service.ts'

function customerToken(request: Request) {
  const token = parseCookies(request.headers.cookie)[CUSTOMER_COOKIE] ?? ''
  return isOpaqueToken(token) ? token : ''
}

export function createPlayersController(database: PrismaClient) {
  const list: RequestHandler = async (request, response) => {
    await requireCustomerSession(database, customerToken(request), new Date())
    const date = request.query.date
    if (!isClubDate(date)) throw new ApiError(400, 'INVALID_DATE')
    response.json(await getSessionPlayers(database, date))
  }
  return { list }
}
