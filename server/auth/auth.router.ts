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
  // Sign-in without a password: the testing shortcut on development servers and the admin demo button on the hosted
  // demo (LAFU_DEMO=1). Never mounted on any other server.
  if (config.developmentMode || config.demo) {
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
