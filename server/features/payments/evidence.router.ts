import { Router } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import { createEvidenceController } from './evidence.controller.ts'

// Mounted under /api/customer: the signed-in member's own proof files.
export function createCustomerEvidenceRouter(database: PrismaClient, privateDir: string) {
  const router = Router()
  router.get('/bookings/:id/proofs/:proofId/files/:fileId', createEvidenceController(database, privateDir).customerFile)
  return router
}

// Mounted under /api/admin after requireAdmin: any proof file, for review.
export function createAdminEvidenceRouter(database: PrismaClient, privateDir: string) {
  const router = Router()
  router.get('/proofs/:proofId/files/:fileId', createEvidenceController(database, privateDir).adminFile)
  return router
}
