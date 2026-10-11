import { Router } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { createRecapController } from './recap.controller.ts'

export function createRecapRouter(database: PrismaClient) {
  const router = Router()
  const controller = createRecapController(database)
  router.get('/recap', controller.show)
  router.get('/recap/export', controller.exportWorkbook)
  return router
}
