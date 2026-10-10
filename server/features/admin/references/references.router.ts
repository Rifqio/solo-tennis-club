import { Router } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { createReferenceController } from './reference.controller.ts'
import { getReferenceCounts } from './reference.service.ts'

export function createReferencesRouter(database: PrismaClient) {
  const router = Router()
  // Active records per list, for the Kelola tabs.
  router.get('/reference-counts', async (_request, response) => { response.json(await getReferenceCounts(database)) })
  const routes = [
    ['coaches', 'coach'],
    ['venues', 'venue'],
    ['levels', 'level'],
  ] as const

  for (const [path, kind] of routes) {
    const controller = createReferenceController(database, kind)
    if (kind === 'venue') router.post('/venues/map-location', controller.mapLocation)
    router.get(`/${path}`, controller.list)
    router.get(`/${path}/:id`, controller.detail)
    router.get(`/${path}/:id/usage`, controller.usage)
    router.post(`/${path}/:id/archive`, controller.archive)
    router.post(`/${path}/:id/restore`, controller.restore)
    router.post(`/${path}`, controller.create)
    router.put(`/${path}/:id`, controller.update)
  }
  return router
}
