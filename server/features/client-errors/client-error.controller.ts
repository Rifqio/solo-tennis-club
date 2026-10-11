import type { RequestHandler } from 'express'
import { z } from 'zod'
import { CLIENT_ERROR_CODE_PATTERN } from '../../../shared/api/client-errors.ts'
import { ApiError } from '../../http/errors.ts'
import type { createClientErrorService } from './client-error.service.ts'

// Control characters are stripped so a report can never forge extra log lines.
const isControl = (character: string) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
const oneLine = (max: number) => z.string().max(max)
  .transform(value => Array.from(value, character => isControl(character) ? ' ' : character).join('').replace(/ {2,}/g, ' ').trim())

const reportSchema = z.strictObject({
  code: z.string().regex(CLIENT_ERROR_CODE_PATTERN),
  kind: z.enum(['render', 'chunk']),
  path: oneLine(300).refine(path => path.startsWith('/')),
  message: oneLine(500),
})

export function createClientErrorController(service: ReturnType<typeof createClientErrorService>) {
  const report: RequestHandler = (request, response) => {
    const parsed = reportSchema.safeParse(request.body)
    if (!parsed.success) throw new ApiError(400, 'VALIDATION_FAILED')
    service.record(parsed.data, request.ip ?? 'unknown')
    response.status(204).end()
  }
  return { report }
}
