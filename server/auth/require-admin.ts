import type { RequestHandler } from 'express'
import type { PrismaClient } from '../generated/prisma/client.ts'
import type { RuntimeConfig } from '../config/runtime-config.ts'
import { ADMIN_COOKIE, clearSessionCookie, parseCookies } from './cookie.ts'
import { findValidAdminSession } from './session-store.ts'
import { ApiError } from '../http/errors.ts'
import { DEVELOPMENT_ADMIN_ID } from './development-admin.ts'

export function requireAdmin(database: PrismaClient, config: RuntimeConfig): RequestHandler {
  return async (request, response, next) => {
    const token = parseCookies(request.headers.cookie)[ADMIN_COOKIE] ?? ''
    const session = await findValidAdminSession(database, token)
    if (!session || session.admin.id === DEVELOPMENT_ADMIN_ID) {
      response.setHeader('Set-Cookie', clearSessionCookie(config.cookieSecure))
      throw new ApiError(401, 'UNAUTHENTICATED')
    }
    response.locals.admin = {
      id: session.admin.id,
      email: session.admin.email,
      displayName: session.admin.displayName,
    }
    response.locals.adminSession = session
    next()
  }
}
