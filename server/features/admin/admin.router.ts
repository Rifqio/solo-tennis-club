import { Router, json } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import type { RuntimeConfig } from '../../config/runtime-config.ts'
import { createAuthenticatedAuthRouter, createSignInRouter } from '../../auth/auth.router.ts'
import { requireAdmin } from '../../auth/require-admin.ts'
import { requireCsrf, requireJson, requireSameOrigin } from '../../http/mutation-guards.ts'
import { createSessionsRouter } from './sessions/sessions.router.ts'
import { createReferencesRouter } from './references/references.router.ts'
import { createCoachPhotoRouter } from './references/coach-photo.router.ts'
import { createClassesRouter } from './classes/classes.router.ts'
import { createAdminBookingsRouter } from './bookings/bookings.router.ts'
import { createAdminEvidenceRouter } from '../payments/evidence.router.ts'
export function createAdminRouter({ prisma, config, uploadsDir, privateDir }: { prisma: PrismaClient; config: RuntimeConfig; uploadsDir: string; privateDir: string }) {
  const router = Router()
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
  router.use(createSignInRouter(prisma, config))
  router.use(requireAdmin(prisma, config))
  // Image bodies, so before the JSON-only guard; the photo router applies the same-origin and CSRF checks itself.
  router.use(createCoachPhotoRouter(prisma, config, uploadsDir))
  // Payment proof files (reads only), for any signed-in admin.
  router.use(createAdminEvidenceRouter(prisma, privateDir))
  router.use(requireSameOrigin(config), requireJson, requireCsrf)
  router.use(json({ limit: '32kb' }))
  router.use(createAuthenticatedAuthRouter(prisma, config))
  router.use(createSessionsRouter(prisma))
  router.use(createReferencesRouter(prisma))
  router.use(createClassesRouter(prisma))
  router.use(createAdminBookingsRouter(prisma))
  return router
}
