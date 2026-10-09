import type { RequestHandler } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import { clubToday, isClubDate } from '../../../shared/club-time.ts'
import { ApiError } from '../../http/errors.ts'
import { getPublicSchedule } from './schedule.service.ts'
import { getPublicSessionDetail } from './session-detail.service.ts'
import { getUpcomingBookable } from './upcoming.service.ts'

export function createPublicController(database: PrismaClient) {
  const detail: RequestHandler<{ id: string }> = async (request, response) => {
    const session = await getPublicSessionDetail(database, request.params.id)
    response.set('Cache-Control', 'no-store').json(session)
  }
  const schedule: RequestHandler = async (request, response) => {
    const date = request.query.date ?? clubToday()
    if (!isClubDate(date)) throw new ApiError(400, 'INVALID_DATE')
    const result = await getPublicSchedule(database, date)
    response.set('Cache-Control', 'no-store').json(result)
  }
  const upcoming: RequestHandler = async (_request, response) => {
    response.set('Cache-Control', 'no-store').json(await getUpcomingBookable(database))
  }
  return { detail, schedule, upcoming }
}
