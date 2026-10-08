import { Router } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../generated/prisma/client.ts'
import type { RuntimeConfig } from '../config/runtime-config.ts'
import { requireJson, requireSameOrigin } from '../http/mutation-guards.ts'
import { ApiError } from '../http/errors.ts'
import { verifyPassword, verifyAgainstDummy } from './password.ts'
import { createAdminSession, revokeAdminSession } from './session-store.ts'
import { serializeSessionCookie, clearSessionCookie } from './cookie.ts'
import { checkSignInThrottle, recordSignInAttempt, signInKeys } from './throttle.ts'
const signInInput = z.strictObject({ email: z.string().trim().toLowerCase().pipe(z.email().max(254)), password: z.string().min(1).max(256) })
export function createSignInRouter(prisma: PrismaClient, config: RuntimeConfig) {
  const router = Router()
  router.post('/auth/sign-in', requireSameOrigin(config), requireJson, async (req, res) => {
    const parsed = signInInput.safeParse(req.body)
    if (!parsed.success) throw new ApiError(401, 'SIGN_IN_FAILED')
    const keys = signInKeys(parsed.data.email, req.ip ?? req.socket.remoteAddress ?? 'unknown')
    const throttle = await checkSignInThrottle(prisma, keys)
    if (throttle.throttled) {
      res.setHeader('Retry-After', String(throttle.retryAfterSeconds))
      throw new ApiError(429, 'SIGN_IN_THROTTLED', undefined, undefined, throttle.retryAfterSeconds)
    }
    const account = await prisma.adminAccount.findUnique({ where: { email: parsed.data.email } })
    const valid = account?.isActive ? await verifyPassword(parsed.data.password, account.passwordHash) : await verifyAgainstDummy(parsed.data.password)
    await recordSignInAttempt(prisma, keys, valid)
    if (!valid || !account) throw new ApiError(401, 'SIGN_IN_FAILED')
    const session = await createAdminSession(prisma, account.id)
    res.setHeader('Set-Cookie', serializeSessionCookie(session.token, { secure: config.cookieSecure, expiresAt: session.expiresAt }))
    res.json({ admin: { email: account.email, displayName: account.displayName }, csrfToken: session.csrfToken, expiresAt: session.expiresAt.toISOString() })
  })
  return router
}
export function createAuthenticatedAuthRouter(prisma: PrismaClient, config: RuntimeConfig) {
  const router = Router()
  router.get('/auth/session', (_req, res) => {
    const { email, displayName } = res.locals.admin
    res.json({ admin: { email, displayName }, csrfToken: res.locals.adminSession.csrfToken, expiresAt: res.locals.adminSession.expiresAt.toISOString() })
  })
  router.post('/auth/sign-out', async (_req, res) => {
    await revokeAdminSession(prisma, res.locals.adminSession.id)
    res.setHeader('Set-Cookie', clearSessionCookie(config.cookieSecure)).status(204).end()
  })
  return router
}
