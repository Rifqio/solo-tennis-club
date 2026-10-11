import type { Request, RequestHandler } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { parseCookies } from '../../../auth/cookie.ts'
import { ApiError } from '../../../http/errors.ts'
import { CUSTOMER_COOKIE } from '../auth/customer-cookie.ts'
import { isOpaqueToken, requireCustomerSession, requireMatchingCsrf } from '../auth/customer-session.service.ts'
import type { AccountService } from './account.service.ts'

const nameInput = z.strictObject({ displayName: z.string().min(1).max(120) })
const phoneInput = z.strictObject({ phone: z.string().min(1).max(50) })
const verifyInput = z.strictObject({ challengeId: z.uuid(), code: z.string().regex(/^\d{6}$/) })

function parseInput<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw new ApiError(400, 'VALIDATION_FAILED', Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0] ?? 'body'), 'INVALID_FORMAT' as const])))
  return parsed.data
}

function customerToken(request: Request) {
  const token = parseCookies(request.headers.cookie)[CUSTOMER_COOKIE] ?? ''
  return isOpaqueToken(token) ? token : ''
}

export function createAccountController(database: PrismaClient, service: AccountService) {
  // Every write: a live session and its CSRF token.
  async function signedInWriter(request: Request) {
    const session = await requireCustomerSession(database, customerToken(request), new Date())
    requireMatchingCsrf(request.get('x-csrf-token') ?? '', session.csrfToken)
    return session
  }
  const ipOf = (request: Request) => request.ip ?? request.socket.remoteAddress ?? 'unknown'

  const show: RequestHandler = async (request, response) => {
    const session = await requireCustomerSession(database, customerToken(request), new Date())
    response.json({ ...(await service.readAccount(session.customer.id)), csrfToken: session.csrfToken })
  }
  const rename: RequestHandler = async (request, response) => {
    const session = await signedInWriter(request)
    response.json(await service.rename(session.customer.id, parseInput(nameInput, request.body).displayName))
  }
  const requestPhoneChange: RequestHandler = async (request, response) => {
    const session = await signedInWriter(request)
    response.status(201).json(await service.requestPhoneChange(session.customer, session.id, parseInput(phoneInput, request.body).phone, ipOf(request)))
  }
  const confirmPhoneChange: RequestHandler = async (request, response) => {
    const session = await signedInWriter(request)
    const input = parseInput(verifyInput, request.body)
    response.json(await service.confirmPhoneChange(session.customer.id, session.id, input.challengeId, input.code, ipOf(request)))
  }
  return { show, rename, requestPhoneChange, confirmPhoneChange }
}
