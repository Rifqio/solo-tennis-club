import { Router } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { createSessionController } from './session.controller.ts'
import { createRosterController } from './roster.controller.ts'

export function createSessionsRouter(database: PrismaClient) {
  const router = Router()
  const controller = createSessionController(database)
  const roster = createRosterController(database)
  router.get('/sessions', controller.list)
  router.get('/sessions/:id/roster', roster.detail)
  router.get('/session-options', controller.options)
  router.post('/sessions', controller.create)
  router.get('/sessions/:id', controller.detail)
  router.put('/sessions/:id', controller.update)
  return router
}
