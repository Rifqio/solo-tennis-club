import type { Request, RequestHandler } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { RuntimeConfig } from '../../../config/runtime-config.ts'
import { parseCookies } from '../../../auth/cookie.ts'
import { ApiError } from '../../../http/errors.ts'
import type { CustomerAuthService } from './customer-auth.service.ts'
import { isOpaqueToken, randomToken, requireCustomerSession, signOutCustomer } from './customer-session.service.ts'
import { CUSTOMER_COOKIE, OTP_FLOW_COOKIE, PROFILE_COOKIE, clearCustomerCookie, serializeCustomerCookie } from './customer-cookie.ts'

const requestInput = z.union([
  z.strictObject({ phone: z.string().min(1).max(50) }),
  z.strictObject({ challengeId: z.uuid() }),
])
const verifyInput = z.strictObject({ challengeId: z.uuid(), code: z.string().regex(/^\d{6}$/) })
const profileInput = z.strictObject({ name: z.string().min(1).max(120) })

function parseInput<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0] ?? 'body'), 'INVALID_FORMAT' as const]))
    throw new ApiError(400, 'VALIDATION_FAILED', fields)
  }
  return parsed.data
}

function cookie(request: Request, name: string): string {
  const value = parseCookies(request.headers.cookie)[name] ?? ''
  return isOpaqueToken(value) ? value : ''
}

export function createCustomerAuthController(database: PrismaClient, service: CustomerAuthService, config: RuntimeConfig) {
  const requestCode: RequestHandler = async (request, response) => {
    const input = parseInput(requestInput, request.body)
    const flowToken = cookie(request, OTP_FLOW_COOKIE) || randomToken()
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown'
    const result = 'phone' in input
      ? await service.requestCode(input.phone, ip, flowToken)
      : await service.resendCode(input.challengeId, ip, flowToken)
    response.setHeader('Set-Cookie', [
      serializeCustomerCookie(OTP_FLOW_COOKIE, flowToken, new Date(Date.now() + 30 * 60 * 1000), config.cookieSecure),
      clearCustomerCookie(PROFILE_COOKIE, config.cookieSecure),
    ])
    response.status(201).json(result)
  }
  const verifyCode: RequestHandler = async (request, response) => {
    const input = parseInput(verifyInput, request.body)
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown'
    const result = await service.verifyCode(input.challengeId, input.code, ip, cookie(request, OTP_FLOW_COOKIE))
    if (result.next === 'complete') {
      response.setHeader('Set-Cookie', [
        serializeCustomerCookie(CUSTOMER_COOKIE, result.session.token, result.session.expiresAt, config.cookieSecure),
        clearCustomerCookie(PROFILE_COOKIE, config.cookieSecure),
        clearCustomerCookie(OTP_FLOW_COOKIE, config.cookieSecure),
      ])
      response.json({ next: 'complete', session: result.session.response })
    } else {
      response.setHeader('Set-Cookie', serializeCustomerCookie(PROFILE_COOKIE, result.proofToken, result.expiresAt, config.cookieSecure))
      response.json({ next: 'name', csrfToken: result.csrfToken, expiresAt: result.expiresAt.toISOString() })
    }
  }
  const readProfile: RequestHandler = async (request, response) => {
    response.json(await service.readProfile(cookie(request, PROFILE_COOKIE), cookie(request, OTP_FLOW_COOKIE)))
  }
  const readChallenge: RequestHandler = async (request, response) => {
    response.json(await service.readPendingChallenge(cookie(request, OTP_FLOW_COOKIE)))
  }
  const completeProfile: RequestHandler = async (request, response) => {
    const input = parseInput(profileInput, request.body)
    const result = await service.completeProfile(input.name, cookie(request, PROFILE_COOKIE), cookie(request, OTP_FLOW_COOKIE), request.get('x-csrf-token') ?? '')
    response.setHeader('Set-Cookie', [
      serializeCustomerCookie(CUSTOMER_COOKIE, result.token, result.expiresAt, config.cookieSecure),
      clearCustomerCookie(PROFILE_COOKIE, config.cookieSecure),
      clearCustomerCookie(OTP_FLOW_COOKIE, config.cookieSecure),
    ])
    response.status(201).json(result.response)
  }
  const readSession: RequestHandler = async (request, response) => {
    const session = await requireCustomerSession(database, cookie(request, CUSTOMER_COOKIE), new Date())
    response.json({
      customer: { id: session.customer.id, displayName: session.customer.displayName, phone: session.customer.phone },
      csrfToken: session.csrfToken,
      expiresAt: session.expiresAt.toISOString(),
    })
  }
  const signOut: RequestHandler = async (request, response) => {
    parseInput(z.strictObject({}), request.body)
    await signOutCustomer(database, cookie(request, CUSTOMER_COOKIE), request.get('x-csrf-token') ?? '', new Date())
    response.setHeader('Set-Cookie', [
      clearCustomerCookie(CUSTOMER_COOKIE, config.cookieSecure),
      clearCustomerCookie(PROFILE_COOKIE, config.cookieSecure),
      clearCustomerCookie(OTP_FLOW_COOKIE, config.cookieSecure),
    ])
    response.status(204).end()
  }
  return { requestCode, verifyCode, readProfile, readChallenge, completeProfile, readSession, signOut }
}
