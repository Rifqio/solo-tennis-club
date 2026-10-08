import type { RequestHandler } from 'express'
import type { PrismaClient } from '../generated/prisma/client.ts'
import type { RuntimeConfig } from '../config/runtime-config.ts'
import { ADMIN_COOKIE, clearSessionCookie, parseCookies } from './cookie.ts'
import { findValidAdminSession } from './session-store.ts'
import { ApiError } from '../http/errors.ts'
export function requireAdmin(prisma: PrismaClient, config: RuntimeConfig): RequestHandler {
  return async (req, res, next) => {
    const session = await findValidAdminSession(prisma, parseCookies(req.headers.cookie)[ADMIN_COOKIE] ?? '')
    if (!session) { res.setHeader('Set-Cookie', clearSessionCookie(config.cookieSecure)); throw new ApiError(401, 'UNAUTHENTICATED') }
    res.locals.admin = { id: session.admin.id, email: session.admin.email, displayName: session.admin.displayName }
    res.locals.adminSession = session
    next()
  }
}
