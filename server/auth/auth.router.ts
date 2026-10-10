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
  // Testing shortcut: mounted only on development servers, never in production.
  if (config.developmentMode) {
    router.post('/auth/dev-sign-in', requireSameOrigin(config), requireJson, json({ limit: '1kb' }), controller.developmentSignIn)
  }
  return router
}

export function createAuthenticatedAuthRouter(database: PrismaClient, config: RuntimeConfig) {
  const router = Router()
  const controller = createAuthController(database, config)
  router.get('/auth/session', controller.session)
  router.post('/auth/sign-out', controller.signOut)
  return router
}
