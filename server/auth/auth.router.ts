import { Router, json } from 'express'
import type { PrismaClient } from '../generated/prisma/client.ts'
import type { RuntimeConfig } from '../config/runtime-config.ts'
import { requireJson, requireSameOrigin } from '../http/mutation-guards.ts'
import { createAuthController } from './auth.controller.ts'

export function createSignInRouter(database: PrismaClient, config: RuntimeConfig) {
  const router = Router()
  const controller = createAuthController(database, config)
  router.post(
    '/auth/sign-in',
    requireSameOrigin(config),
    requireJson,
    json({ limit: '32kb' }),
    controller.signIn,
  )
  return router
}

export function createAuthenticatedAuthRouter(database: PrismaClient, config: RuntimeConfig) {
  const router = Router()
  const controller = createAuthController(database, config)
  router.get('/auth/session', controller.session)
  router.post('/auth/sign-out', controller.signOut)
  return router
}
