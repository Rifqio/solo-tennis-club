import { Router, json } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { RuntimeConfig } from '../../../config/runtime-config.ts'
import { ApiError } from '../../../http/errors.ts'
import { requireJson, requireSameOrigin } from '../../../http/mutation-guards.ts'
import { createCustomerAuthController } from './customer-auth.controller.ts'
import { createCustomerAuthService } from './customer-auth.service.ts'
import { createMockOtpAdapter } from './otp.adapter.ts'
import { createCustomerBookingRouter } from '../booking/booking.router.ts'
import { createCustomerPlayersRouter } from '../players/players.router.ts'
import { createMyBookingsRouter } from '../my-bookings/my-bookings.router.ts'
import { createCustomerEvidenceRouter } from '../../payments/evidence.router.ts'

export function createCustomerAuthRouter(database: PrismaClient, config: RuntimeConfig, privateDir: string) {
  const router = Router()
  router.use((_request, response, next) => {
    response.set('Cache-Control', 'no-store')
    next()
  })
  if (!config.developmentMode || config.otpDriver !== 'mock') {
    router.use((_request, _response, next) => next(new ApiError(503, 'TEMPORARILY_UNAVAILABLE')))
    return router
  }
  const service = createCustomerAuthService(database, createMockOtpAdapter())
  const controller = createCustomerAuthController(database, service, config)
  router.use(requireSameOrigin(config), requireJson, json({ limit: '8kb' }))
  router.post('/auth/otp-challenges', controller.requestCode)
  router.get('/auth/otp-challenges/current', controller.readChallenge)
  router.post('/auth/otp-verifications', controller.verifyCode)
  router.get('/auth/profile', controller.readProfile)
  router.post('/auth/profile', controller.completeProfile)
  router.get('/auth/session', controller.readSession)
  router.post('/auth/sign-out', controller.signOut)
  router.use(createCustomerBookingRouter(database))
  router.use(createCustomerPlayersRouter(database))
  router.use(createMyBookingsRouter(database))
  router.use(createCustomerEvidenceRouter(database, privateDir))
  return router
}
