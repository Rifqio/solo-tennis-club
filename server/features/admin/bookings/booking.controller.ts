import type { RequestHandler, Response } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { ApiError } from '../../../http/errors.ts'
import { getAdminBooking, LIST_DEFAULT, LIST_MAX, listAdminBookings } from './booking.service.ts'
import type { AdminBookingCreateService } from './booking-create.service.ts'
import { findVerifiedCustomer, linkBookingToCustomer } from './booking-link.service.ts'
import { reviewProof } from './proof-review.service.ts'

const id = z.string().regex(/^[a-z0-9]{1,64}$/)

const listQuery = z.object({
  status: z.enum(['review', 'unpaid', 'confirmed', 'all']).default('unpaid'),
  cursor: z.string().max(200).optional(),
  q: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(LIST_MAX).default(LIST_DEFAULT),
})

const createBody = z.strictObject({
  sessionId: id,
  quantity: z.number().int().positive().safe(),
  participantNames: z.array(z.string().min(1).max(120)).min(1).max(500),
  expectedSessionVersion: z.number().int().positive().safe(),
  createRequestId: z.uuid(),
  bookerName: z.string().max(120),
  bookerPhone: z.string().max(50),
})

const lookupQuery = z.object({ phone: z.string().min(1).max(50) })

const linkBody = z.strictObject({ customerId: id, version: z.number().int().positive().safe() })

const approveBody = z.strictObject({ version: z.number().int().positive().safe() })
// 'other' needs a note, so the member always reads a reason.
const rejectBody = z.strictObject({
  version: z.number().int().positive().safe(),
  reason: z.enum(['amount_mismatch', 'unreadable', 'not_received', 'other']),
  note: z.string().trim().max(300).optional(),
}).refine(body => body.reason !== 'other' || Boolean(body.note), { path: ['note'] })

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError(400, 'VALIDATION_FAILED', { [String(parsed.error.issues[0]?.path[0] ?? 'body')]: 'INVALID_FORMAT' })
  return parsed.data
}

function adminId(response: Response) {
  return (response.locals.admin as { id: string }).id
}

export function createAdminBookingController(database: PrismaClient, creation: AdminBookingCreateService) {
  const list: RequestHandler = async (request, response) => {
    const query = parse(listQuery, request.query)
    response.json(await listAdminBookings(database, { filter: query.status, cursor: query.cursor ?? null, limit: query.limit, search: query.q ?? null }))
  }
  const detail: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await getAdminBooking(database, request.params.id))
  }
  const options: RequestHandler<{ sessionId: string }> = async (request, response) => {
    if (!id.safeParse(request.params.sessionId).success) throw new ApiError(404, 'NOT_FOUND')
    response.json(await creation.getOptions(request.params.sessionId))
  }
  const create: RequestHandler = async (request, response) => {
    const input = parse(createBody, request.body)
    if (input.quantity !== input.participantNames.length) throw new ApiError(400, 'VALIDATION_FAILED', { participantNames: 'INVALID_FORMAT' })
    const result = await creation.create(adminId(response), input)
    response.status(result.replayed ? 200 : 201).json(result)
  }
  const lookupCustomer: RequestHandler = async (request, response) => {
    const query = parse(lookupQuery, request.query)
    response.json(await findVerifiedCustomer(database, query.phone))
  }
  const linkCustomer: RequestHandler<{ id: string }> = async (request, response) => {
    if (!id.safeParse(request.params.id).success) throw new ApiError(404, 'NOT_FOUND')
    const input = parse(linkBody, request.body)
    response.json(await linkBookingToCustomer(database, { bookingId: request.params.id, customerId: input.customerId, version: input.version, adminId: adminId(response) }))
  }
  const approveProof: RequestHandler<{ id: string; proofId: string }> = async (request, response) => {
    if (!id.safeParse(request.params.id).success || !id.safeParse(request.params.proofId).success) throw new ApiError(404, 'NOT_FOUND')
    const input = parse(approveBody, request.body)
    response.json(await reviewProof(database, { bookingId: request.params.id, proofId: request.params.proofId, version: input.version, adminId: adminId(response), decision: { kind: 'approve' } }))
  }
  const rejectProof: RequestHandler<{ id: string; proofId: string }> = async (request, response) => {
    if (!id.safeParse(request.params.id).success || !id.safeParse(request.params.proofId).success) throw new ApiError(404, 'NOT_FOUND')
    const parsed = rejectBody.safeParse(request.body)
    if (!parsed.success) throw new ApiError(400, 'VALIDATION_FAILED', { [String(parsed.error.issues[0]?.path[0] ?? 'body')]: parsed.error.issues[0]?.path[0] === 'note' ? 'REQUIRED' : 'INVALID_FORMAT' })
    const { version, reason, note } = parsed.data
    response.json(await reviewProof(database, { bookingId: request.params.id, proofId: request.params.proofId, version, adminId: adminId(response), decision: { kind: 'reject', reason, note: note || null } }))
  }
  return { list, detail, options, create, lookupCustomer, linkCustomer, approveProof, rejectProof }
}
