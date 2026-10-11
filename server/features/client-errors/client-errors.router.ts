import { Router } from 'express'
import type { RuntimeConfig } from '../../config/runtime-config.ts'
import { requireJson, requireSameOrigin } from '../../http/mutation-guards.ts'
import { createClientErrorController } from './client-error.controller.ts'
import { createClientErrorService } from './client-error.service.ts'

export function createClientErrorsRouter(config: RuntimeConfig, service = createClientErrorService()) {
  const router = Router()
  const controller = createClientErrorController(service)
  router.post('/', requireSameOrigin(config), requireJson, controller.report)
  return router
}
