import { Router } from 'express'
import { createAdminUploadController } from './upload.controller.ts'

// Mounted under /api/admin after the JSON, same-origin and CSRF guards: a ticket for one direct upload.
export function createAdminUploadRouter() {
  const router = Router()
  router.post('/uploads', createAdminUploadController().ticket)
  return router
}
