import { Router, json, raw } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { RuntimeConfig } from '../../../config/runtime-config.ts'
import { COACH_PHOTO_MAX_BYTES } from '../../../../shared/api/admin-references.ts'
import { requireCsrf, requireSameOrigin } from '../../../http/mutation-guards.ts'
import { createCoachPhotoController } from './coach-photo.controller.ts'
import type { FileStores } from '../../../storage/file-store.ts'

// Coach portraits arrive as the image itself, not JSON, so this router sits before the admin JSON-only guard. It
// keeps the same-origin and CSRF checks; the body is capped at 5 MB and its bytes decide whether it is an image.
// After a direct upload (hosted demo) the body is JSON naming the uploaded file instead.
export function createCoachPhotoRouter(database: PrismaClient, config: RuntimeConfig, files: FileStores) {
  const router = Router()
  const controller = createCoachPhotoController(database, files)
  const guards = [requireSameOrigin(config), requireCsrf]
  router.put('/coaches/:id/photo', ...guards, raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: COACH_PHOTO_MAX_BYTES }), json({ limit: '1kb' }), controller.upload)
  router.delete('/coaches/:id/photo', ...guards, controller.remove)
  return router
}
