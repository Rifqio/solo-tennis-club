import type { RequestHandler } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../generated/prisma/client.ts'
import type { RuntimeConfig } from '../config/runtime-config.ts'
import { ApiError } from '../http/errors.ts'
import { serializeSessionCookie, clearSessionCookie } from './cookie.ts'
import { revokeAdminSession } from './session-store.ts'
import { signInAdmin, signInDemoAdmin, signInDevelopmentAdmin } from './auth.service.ts'

const signInInput = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(1).max(256),
})

export function createAuthController(database: PrismaClient, config: RuntimeConfig) {
  const signIn: RequestHandler = async (request, response) => {
    const parsed = signInInput.safeParse(request.body)
    if (!parsed.success) throw new ApiError(401, 'SIGN_IN_FAILED')

    const result = await signInAdmin(database, {
      ...parsed.data,
      ip: request.ip ?? request.socket.remoteAddress ?? 'unknown',
    })
    sendSession(response, result)
  }
  const developmentSignIn: RequestHandler = async (_request, response) => {
    sendSession(response, await (config.demo ? signInDemoAdmin(database) : signInDevelopmentAdmin(database)))
  }
  function sendSession(response: Parameters<RequestHandler>[1], result: Awaited<ReturnType<typeof signInAdmin>>) {
    response.setHeader('Set-Cookie', serializeSessionCookie(result.session.token, {
      secure: config.cookieSecure,
      expiresAt: result.session.expiresAt,
    }))
    response.json({
      admin: result.admin,
      csrfToken: result.session.csrfToken,
      expiresAt: result.session.expiresAt.toISOString(),
    })
  }
  const session: RequestHandler = (_request, response) => {
    const { email, displayName } = response.locals.admin
    response.json({
      admin: { email, displayName },
      csrfToken: response.locals.adminSession.csrfToken,
      expiresAt: response.locals.adminSession.expiresAt.toISOString(),
    })
  }
  const signOut: RequestHandler = async (_request, response) => {
    await revokeAdminSession(database, response.locals.adminSession.id)
    response.setHeader('Set-Cookie', clearSessionCookie(config.cookieSecure)).status(204).end()
  }
  return { signIn, developmentSignIn, session, signOut }
}
