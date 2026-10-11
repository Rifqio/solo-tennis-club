import { Router } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { createAccountController } from './account.controller.ts'
import type { AccountService } from './account.service.ts'

export function createAccountRouter(database: PrismaClient, service: AccountService) {
  const router = Router()
  const controller = createAccountController(database, service)
  router.get('/account', controller.show)
  router.put('/account/name', controller.rename)
  router.post('/account/phone-challenges', controller.requestPhoneChange)
  router.post('/account/phone-verifications', controller.confirmPhoneChange)
  return router
}
