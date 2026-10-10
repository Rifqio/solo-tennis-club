import { Router } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { createAdminBookingController } from './booking.controller.ts'

export function createAdminBookingsRouter(database: PrismaClient) {
  const router = Router()
  const controller = createAdminBookingController(database)
  router.get('/bookings', controller.list)
  router.get('/bookings/:id', controller.detail)
  return router
}
