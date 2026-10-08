import { Router } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { getSessionOptions } from './session-options.service.ts'
import { createSession } from './session-create.service.ts'
import { parseSessionInput } from './session-input.schema.ts'
export function createSessionsRouter(prisma: PrismaClient) {
  const router = Router()
  router.get('/session-options', async (_req, res) => { res.json(await getSessionOptions(prisma)) })
  router.post('/sessions', async (req, res) => {
    const result = await createSession(prisma, parseSessionInput(req.body), res.locals.admin.id)
    res.status(result.replayed ? 200 : 201).json(result)
  })
  return router
}
