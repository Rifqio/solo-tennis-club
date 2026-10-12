import { Router } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import type { FileStores } from '../../storage/file-store.ts'
import { createCronController } from './cron.controller.ts'

// Mounted under /api/cron. Vercel Cron sends GET; POST is accepted for a manual run with the same secret.
export function createCronRouter(database: PrismaClient, options: { demo: boolean; files: FileStores; publicDir: string; secret?: string }) {
  const router = Router()
  const controller = createCronController(database, options)
  router.get('/daily', controller.daily)
  router.post('/daily', controller.daily)
  return router
}
