import type { RequestHandler } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { ReferenceKind, ReferenceInput } from '../../../../shared/api/admin-references.ts'
import { ApiError } from '../../../http/errors.ts'
import { MAP_URL_MAX } from '../../../../shared/maps.ts'
import { listReferences, getReference, saveReference } from './reference.service.ts'
import { resolveMapLocation } from './map-location.service.ts'

export function createReferenceController(database: PrismaClient, kind: ReferenceKind) {
  const fields = {
    name: z.string().max(1000),
    ...(kind === 'venue' ? {
      address: z.string().max(1000).nullable().optional(),
      mapUrl: z.string().max(MAP_URL_MAX).nullable().optional(),
      latitude: z.number().finite().nullable().optional(),
      longitude: z.number().finite().nullable().optional(),
    } : {}),
  }
  const createInput = z.strictObject({ ...fields, createRequestId: z.uuid() })
  const updateInput = z.strictObject({ ...fields, version: z.number().int().positive() })

  function parseReferenceInput(body: unknown, editing: boolean): ReferenceInput {
    const result = (editing ? updateInput : createInput).safeParse(body)
    if (!result.success) {
      const errors = Object.fromEntries(result.error.issues.map(issue => [String(issue.path[0] ?? 'body'), 'INVALID_FORMAT' as const]))
      throw new ApiError(400, 'VALIDATION_FAILED', errors)
    }
    return result.data as ReferenceInput
  }

  const list: RequestHandler = async (_request, response) => {
    response.json(await listReferences(database, kind))
  }
  const detail: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await getReference(database, kind, request.params.id))
  }
  const create: RequestHandler = async (request, response) => {
    const input = parseReferenceInput(request.body, false)
    response.json(await saveReference(database, kind, input))
  }
  const update: RequestHandler<{ id: string }> = async (request, response) => {
    const input = parseReferenceInput(request.body, true)
    response.json(await saveReference(database, kind, input, request.params.id))
  }
  const mapLocationInput = z.strictObject({ url: z.string().max(MAP_URL_MAX) })
  const mapLocation: RequestHandler = async (request, response) => {
    const result = mapLocationInput.safeParse(request.body)
    if (!result.success) throw new ApiError(400, 'VALIDATION_FAILED', { url: 'INVALID_FORMAT' })
    response.json(await resolveMapLocation(result.data.url))
  }
  return { list, detail, create, update, mapLocation }
}
