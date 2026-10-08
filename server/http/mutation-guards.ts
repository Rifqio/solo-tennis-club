import type { RequestHandler } from 'express'
import { timingSafeEqual } from 'node:crypto'
import type { RuntimeConfig } from '../config/runtime-config.ts'
import { ApiError } from './errors.ts'
const isMutation = (method: string) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
export function requireSameOrigin(config: RuntimeConfig): RequestHandler {
  return (req, _res, next) => {
    const expected = config.publicOrigin ?? `${req.protocol}://${req.get('host')}`
    next(isMutation(req.method) && req.get('origin') !== expected ? new ApiError(403, 'ORIGIN_REJECTED') : undefined)
  }
}
export const requireJson: RequestHandler = (req, _res, next) => {
  next(isMutation(req.method) && !req.is('application/json') ? new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE') : undefined)
}
export const requireCsrf: RequestHandler = (req, res, next) => {
  if (!isMutation(req.method)) return next()
  const supplied = Buffer.from(req.get('x-csrf-token') ?? ''), expected = Buffer.from(res.locals.adminSession.csrfToken)
  next(supplied.length !== expected.length || !timingSafeEqual(supplied, expected) ? new ApiError(403, 'CSRF_FAILED') : undefined)
}
