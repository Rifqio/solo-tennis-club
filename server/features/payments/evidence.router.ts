import { Router } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import type { RuntimeConfig } from '../../config/runtime-config.ts'
import { requireSameOrigin } from '../../http/mutation-guards.ts'
import { createEvidenceController } from './evidence.controller.ts'
import { createCustomerPaymentController } from './customer-payment.controller.ts'

// Mounted under /api/customer: the signed-in member's own proof files, and what to pay for a booking.
export function createCustomerEvidenceRouter(database: PrismaClient, privateDir: string) {
  const router = Router()
  router.get('/bookings/:id/proofs/:proofId/files/:fileId', createEvidenceController(database, privateDir).customerFile)
  router.get('/bookings/:id/payment', createCustomerPaymentController(database, privateDir).payment)
  return router
}

// Mounted under /api/customer before the JSON-only guard: proof files arrive as multipart/form-data. The same-origin
// check stays; the controller checks the member's CSRF token and the body size before reading it.
export function createCustomerProofUploadRouter(database: PrismaClient, config: RuntimeConfig, privateDir: string) {
  const router = Router()
  router.post('/bookings/:id/proofs', requireSameOrigin(config), createCustomerPaymentController(database, privateDir).submit)
  return router
}

// Mounted under /api/admin after requireAdmin: any proof file, for review.
export function createAdminEvidenceRouter(database: PrismaClient, privateDir: string) {
  const router = Router()
  router.get('/proofs/:proofId/files/:fileId', createEvidenceController(database, privateDir).adminFile)
  return router
}
