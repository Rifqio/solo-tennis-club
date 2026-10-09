import type { Request, RequestHandler } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { parseCookies } from '../../../auth/cookie.ts'
import { ApiError } from '../../../http/errors.ts'
import { requireCustomerSession, requireMatchingCsrf, isOpaqueToken } from '../auth/customer-session.service.ts'
import { CUSTOMER_COOKIE } from '../auth/customer-cookie.ts'
import type { CustomerBookingService } from './booking.service.ts'

const reserveSchema = z.strictObject({ sessionId: z.string().regex(/^[a-z0-9]{1,64}$/), quantity: z.number().int().positive().safe(),
  participantNames: z.array(z.string().min(1).max(120)).min(1).max(500), expectedSessionVersion: z.number().int().positive().safe(), createRequestId: z.uuid() })

function customerToken(request: Request) {
  const token = parseCookies(request.headers.cookie)[CUSTOMER_COOKIE] ?? ''
  return isOpaqueToken(token) ? token : ''
}

function parseBody(body: unknown) {
  const parsed = reserveSchema.safeParse(body)
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? 'body')
    throw new ApiError(400, 'VALIDATION_FAILED', { [field]: 'INVALID_FORMAT' })
  }
  if (parsed.data.quantity !== parsed.data.participantNames.length) throw new ApiError(400, 'VALIDATION_FAILED', { participantNames: 'INVALID_FORMAT' })
  return parsed.data
}

export function createCustomerBookingController(database: PrismaClient, service: CustomerBookingService) {
  const options: RequestHandler = async (request, response) => {
    await requireCustomerSession(database, customerToken(request), new Date())
    const sessionId = request.params.sessionId
    response.json(await service.getOptions(typeof sessionId === 'string' ? sessionId : ''))
  }
  const reserve: RequestHandler = async (request, response) => {
    const session = await requireCustomerSession(database, customerToken(request), new Date())
    requireMatchingCsrf(request.get('x-csrf-token') ?? '', session.csrfToken)
    const input = parseBody(request.body)
    const result = await service.reserve({ id: session.customer.id, displayName: session.customer.displayName, phone: session.customer.phone }, input)
    response.status(result.replayed ? 200 : 201).json(result)
  }
  return { options, reserve }
}
