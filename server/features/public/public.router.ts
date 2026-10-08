import { Router } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import { clubToday, isClubDate } from '../../../shared/club-time.ts'
import { ApiError } from '../../http/errors.ts'
import { getPublicSchedule } from './schedule.service.ts'

export function createPublicRouter({ prisma }: { prisma: PrismaClient }) {
  const router = Router()
  router.get('/schedule', async (request, response) => {
    const date = request.query.date ?? clubToday()
    if (!isClubDate(date)) throw new ApiError(400, 'INVALID_DATE')
    response.set('Cache-Control', 'no-store').json(await getPublicSchedule(prisma, date))
  })
  return router
}
