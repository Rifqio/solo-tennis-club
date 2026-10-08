import { Router, json } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import type { RuntimeConfig } from '../../config/runtime-config.ts'
import { createAuthenticatedAuthRouter, createSignInRouter } from '../../auth/auth.router.ts'
import { requireAdmin } from '../../auth/require-admin.ts'
import { requireCsrf, requireJson, requireSameOrigin } from '../../http/mutation-guards.ts'
import { createSessionsRouter } from './sessions/sessions.router.ts'
export function createAdminRouter({ prisma, config }: { prisma: PrismaClient; config: RuntimeConfig }) {
  const router = Router()
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
  router.use(createSignInRouter(prisma, config))
  router.use(requireAdmin(prisma, config))
  router.use(requireSameOrigin(config), requireJson, requireCsrf)
  router.use(json({ limit: '32kb' }))
  router.use(createAuthenticatedAuthRouter(prisma, config))
  router.use(createSessionsRouter(prisma))
  return router
}
