import type { RequestHandler } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { UpdateSessionInput } from '../../../../shared/api/admin-sessions.ts'
import { ApiError } from '../../../http/errors.ts'
import { getSessionOptions } from './session-options.service.ts'
import { createSession } from './session-create.service.ts'
import { parseSessionInput, sessionInputSchema } from './session-input.schema.ts'
import { listAdminSessions } from './session-list.service.ts'
import { getAdminSession } from './session-detail.service.ts'
import { updateSession } from './session-update.service.ts'

const updateInput = sessionInputSchema.omit({ createRequestId: true }).extend({
  version: z.number().int().positive(),
})

export function createSessionController(database: PrismaClient) {
  const list: RequestHandler = async (request, response) => {
    const date = request.query.date
    if (date !== undefined && typeof date !== 'string') throw new ApiError(400, 'INVALID_DATE')
    response.json(await listAdminSessions(database, new Date(), date))
  }
  const options: RequestHandler = async (_request, response) => {
    response.json(await getSessionOptions(database))
  }
  const create: RequestHandler = async (request, response) => {
    const input = parseSessionInput(request.body)
    const result = await createSession(database, input, response.locals.admin.id)
    response.status(result.replayed ? 200 : 201).json(result)
  }
  const detail: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await getAdminSession(database, request.params.id))
  }
  const update: RequestHandler<{ id: string }> = async (request, response) => {
    const parsed = updateInput.safeParse(request.body)
    if (!parsed.success) {
      const fields = Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0] ?? 'body'), 'INVALID_FORMAT' as const]))
      throw new ApiError(400, 'VALIDATION_FAILED', fields)
    }
    const input = parsed.data as UpdateSessionInput
    response.json(await updateSession(database, request.params.id, input, response.locals.admin.id))
  }
  return { list, options, create, detail, update }
}
