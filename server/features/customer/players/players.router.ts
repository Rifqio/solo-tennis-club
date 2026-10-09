import { Router } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { createPlayersController } from './players.controller.ts'

export function createCustomerPlayersRouter(database: PrismaClient) {
  const router = Router()
  const controller = createPlayersController(database)
  router.get('/session-players', controller.list)
  return router
}
