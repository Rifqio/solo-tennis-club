import type { RequestHandler } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { ClassInput } from '../../../../shared/api/admin-classes.ts'
import { ApiError } from '../../../http/errors.ts'
import { getClass, listClassPage, saveClass } from './class.service.ts'
import { parseNamePageQuery } from '../listing/name-page.ts'

const numeric = z.union([z.number(), z.string(), z.null()]).optional()
const fields = {
  name: z.string(),
  defaultLevelId: z.string(),
  defaultVenueId: z.string(),
  defaultDurationMinutes: numeric,
  defaultPriceIdr: numeric,
  defaultMinParticipants: numeric,
  defaultMaxParticipants: numeric,
  defaultCoachIds: z.array(z.string()),
}
const createInput = z.strictObject({ ...fields, createRequestId: z.uuid() })
const updateInput = z.strictObject({ ...fields, version: z.number().int().positive() })

function parseClassInput(body: unknown, editing: boolean): ClassInput {
  const result = (editing ? updateInput : createInput).safeParse(body)
  if (!result.success) {
    const errors = Object.fromEntries(result.error.issues.map(issue => [String(issue.path[0] ?? 'body'), 'INVALID_FORMAT' as const]))
    throw new ApiError(400, 'VALIDATION_FAILED', errors)
  }
  return result.data as ClassInput
}

export function createClassController(database: PrismaClient) {
  const list: RequestHandler = async (request, response) => {
    response.json(await listClassPage(database, parseNamePageQuery(request.query)))
  }
  const detail: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await getClass(database, request.params.id))
  }
  const create: RequestHandler = async (request, response) => {
    const input = parseClassInput(request.body, false)
    response.json(await saveClass(database, input))
  }
  const update: RequestHandler<{ id: string }> = async (request, response) => {
    const input = parseClassInput(request.body, true)
    response.json(await saveClass(database, input, request.params.id))
  }
  return { list, detail, create, update }
}
