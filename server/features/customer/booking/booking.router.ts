import { Router } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { createCustomerBookingController } from './booking.controller.ts'
import { createCustomerBookingService } from './booking.service.ts'

export function createCustomerBookingRouter(database: PrismaClient) {
  const router = Router()
  const controller = createCustomerBookingController(database, createCustomerBookingService(database))
  router.get('/booking-options/:sessionId', controller.options)
  router.post('/bookings', controller.reserve)
  return router
}
