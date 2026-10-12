import { Router, json, raw } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import type { RuntimeConfig } from '../../config/runtime-config.ts'
import { SESSION_PHOTO_MAX_BYTES } from '../../../shared/api/session-photos.ts'
import { requireCsrf, requireJson, requireSameOrigin } from '../../http/mutation-guards.ts'
import { createAdminPhotoController, createPublicPhotoController } from './session-photo.controller.ts'

// Admin album routes. The upload body is the image itself, so this router sits before the admin JSON-only guard and
// applies the same-origin and CSRF checks itself; the other changes are JSON.
export function createAdminPhotoRouter(database: PrismaClient, config: RuntimeConfig, uploadsDir: string) {
  const router = Router()
  const controller = createAdminPhotoController(database, uploadsDir)
  const guards = [requireSameOrigin(config), requireCsrf]
  const body = [...guards, requireJson, json({ limit: '16kb' })]
  router.get('/sessions/:id/photos', controller.album)
  router.post('/sessions/:id/photos', ...guards, raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: SESSION_PHOTO_MAX_BYTES }), controller.upload)
  router.put('/sessions/:id/photos/cover', ...body, controller.cover)
  router.post('/sessions/:id/photos/delete', ...body, controller.remove)
  router.post('/sessions/:id/photos/restore', ...body, controller.restore)
  return router
}

export function createPublicPhotoRouter(database: PrismaClient, uploadsDir: string, publicDir: string) {
  const router = Router()
  const controller = createPublicPhotoController(database, uploadsDir, publicDir)
  router.get('/albums', controller.recent)
  router.get('/sessions/:id/photos', controller.album)
  router.get('/sessions/:id/photos.zip', controller.zip)
  return router
}
