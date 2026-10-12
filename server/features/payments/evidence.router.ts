import { Router, json } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import type { RuntimeConfig } from '../../config/runtime-config.ts'
import { requireSameOrigin } from '../../http/mutation-guards.ts'
import { createEvidenceController } from './evidence.controller.ts'
import { createCustomerPaymentController } from './customer-payment.controller.ts'
import type { FileStores } from '../../storage/file-store.ts'

// Mounted under /api/customer: the signed-in member's own proof files, and what to pay for a booking.
export function createCustomerEvidenceRouter(database: PrismaClient, files: FileStores) {
  const router = Router()
  router.get('/bookings/:id/proofs/:proofId/files/:fileId', createEvidenceController(database, files.privateFiles).customerFile)
  router.get('/bookings/:id/payment', createCustomerPaymentController(database, files).payment)
  router.post('/uploads', createCustomerPaymentController(database, files).uploadTicket)
  return router
}

// Mounted under /api/customer before the JSON-only guard: proof files arrive as multipart/form-data, or as JSON naming
// files already uploaded straight to Blob (hosted demo). The same-origin check stays; the controller checks the
// member's CSRF token and the body size before reading it.
export function createCustomerProofUploadRouter(database: PrismaClient, config: RuntimeConfig, files: FileStores) {
  const router = Router()
  router.post('/bookings/:id/proofs', requireSameOrigin(config), json({ limit: '4kb' }), createCustomerPaymentController(database, files).submit)
  return router
}

// Mounted under /api/admin after requireAdmin: any proof file, for review.
export function createAdminEvidenceRouter(database: PrismaClient, files: FileStores) {
  const router = Router()
  router.get('/proofs/:proofId/files/:fileId', createEvidenceController(database, files.privateFiles).adminFile)
  return router
}
