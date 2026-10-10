import { Router } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import { createPublicController } from './public.controller.ts'

export function createPublicRouter({ prisma }: { prisma: PrismaClient }) {
  const router = Router()
  const controller = createPublicController(prisma)
  router.get('/sessions/:id', controller.detail)
  router.get('/schedule', controller.schedule)
  router.get('/upcoming', controller.upcoming)
  router.get('/venues', controller.venues)
  return router
}
