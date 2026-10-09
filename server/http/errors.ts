import type { ErrorRequestHandler } from 'express'
import type { ApiErrorCode, FieldErrorCode, ApiErrorBody } from '../../shared/api/errors.ts'
import { DatabaseBusyError } from '../database/transaction.ts'

export class ApiError extends Error {
  status: number
  code: ApiErrorCode
  fields?: Record<string, FieldErrorCode>
  latest?: unknown
  retryAfterSeconds?: number
  constructor(status: number, code: ApiErrorCode, fields?: Record<string, FieldErrorCode>, latest?: unknown, retryAfterSeconds?: number) {
    super(code)
    Object.assign(this, { fields, latest, retryAfterSeconds })
    this.status = status
    this.code = code
  }
}
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next
  let apiError: ApiError
  if (error instanceof ApiError) apiError = error
  else if (error instanceof DatabaseBusyError) apiError = new ApiError(503, 'TEMPORARILY_UNAVAILABLE')
  else if (error?.type === 'entity.too.large') apiError = new ApiError(413, 'PAYLOAD_TOO_LARGE')
  else if (error?.type === 'entity.parse.failed') apiError = new ApiError(400, 'VALIDATION_FAILED')
  else {
    console.error('Unhandled server error', error instanceof Error ? error.stack : 'Unknown error')
    apiError = new ApiError(500, 'INTERNAL')
  }
  const body: ApiErrorBody = { error: { code: apiError.code } }
  if (apiError.fields) body.error.fields = apiError.fields
  if (apiError.latest !== undefined) body.error.latest = apiError.latest
  if (apiError.retryAfterSeconds !== undefined) body.error.retryAfterSeconds = apiError.retryAfterSeconds
  if (apiError.status === 429 && apiError.retryAfterSeconds !== undefined) {
    response.setHeader('Retry-After', String(apiError.retryAfterSeconds))
  }
  response.status(apiError.status).json(body)
}
