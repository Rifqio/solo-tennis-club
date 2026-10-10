import { Router, json } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import type { RuntimeConfig } from '../../config/runtime-config.ts'
import { createAuthenticatedAuthRouter, createSignInRouter } from '../../auth/auth.router.ts'
import { requireAdmin } from '../../auth/require-admin.ts'
import { requireCsrf, requireJson, requireSameOrigin } from '../../http/mutation-guards.ts'
import { createSessionsRouter } from './sessions/sessions.router.ts'
import { createReferencesRouter } from './references/references.router.ts'
import { createClassesRouter } from './classes/classes.router.ts'
import { createAdminBookingsRouter } from './bookings/bookings.router.ts'
export function createAdminRouter({ prisma, config }: { prisma: PrismaClient; config: RuntimeConfig }) {
  const router = Router()
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
  router.use(createSignInRouter(prisma, config))
  router.use(requireAdmin(prisma, config))
  router.use(requireSameOrigin(config), requireJson, requireCsrf)
  router.use(json({ limit: '32kb' }))
  router.use(createAuthenticatedAuthRouter(prisma, config))
  router.use(createSessionsRouter(prisma))
  router.use(createReferencesRouter(prisma))
  router.use(createClassesRouter(prisma))
  router.use(createAdminBookingsRouter(prisma))
  return router
}
