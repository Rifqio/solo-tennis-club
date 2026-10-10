import { Router } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { createMyBookingsController } from './my-bookings.controller.ts'

export function createMyBookingsRouter(database: PrismaClient) {
  const router = Router()
  const controller = createMyBookingsController(database)
  router.get('/bookings', controller.list)
  router.get('/bookings/:id', controller.detail)
  return router
}
