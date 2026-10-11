import { Router } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { createAdminBookingController } from './booking.controller.ts'
import { createAdminBookingCreateService } from './booking-create.service.ts'

export function createAdminBookingsRouter(database: PrismaClient) {
  const router = Router()
  const controller = createAdminBookingController(database, createAdminBookingCreateService(database))
  router.get('/bookings', controller.list)
  router.post('/bookings', controller.create)
  router.get('/bookings/:id', controller.detail)
  router.put('/bookings/:id/customer-link', controller.linkCustomer)
  router.post('/bookings/:id/proofs/:proofId/approve', controller.approveProof)
  router.post('/bookings/:id/proofs/:proofId/reject', controller.rejectProof)
  router.get('/booking-options/:sessionId', controller.options)
  router.get('/verified-customers', controller.lookupCustomer)
  return router
}
