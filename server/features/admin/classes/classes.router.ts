import { Router } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { createClassController } from './class.controller.ts'

export function createClassesRouter(database: PrismaClient) {
  const router = Router()
  const controller = createClassController(database)
  router.get('/classes', controller.list)
  router.get('/classes/:id', controller.detail)
  router.post('/classes', controller.create)
  router.put('/classes/:id', controller.update)
  return router
}
