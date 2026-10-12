import { timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import type { FileStores } from '../../storage/file-store.ts'
import { ApiError } from '../../http/errors.ts'
import { runDailyJobs } from './cron.service.ts'

// Vercel Cron calls with "Authorization: Bearer <CRON_SECRET>". Without a configured secret the route answers 404.
function hasCronSecret(header: string | undefined, secret: string) {
  const supplied = Buffer.from(header ?? ''), expected = Buffer.from(`Bearer ${secret}`)
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}

export function createCronController(database: PrismaClient, options: { demo: boolean; files: FileStores; publicDir: string; secret?: string }) {
  const daily: RequestHandler = async (request, response) => {
    if (!options.secret) throw new ApiError(404, 'NOT_FOUND')
    if (!hasCronSecret(request.get('authorization'), options.secret)) throw new ApiError(401, 'UNAUTHENTICATED')
    const result = await runDailyJobs(database, options)
    console.log(`Daily jobs: ${result.expired} bookings expired${result.reset ? `, demo reset (${result.reset.removedFiles} files removed)` : ''}`)
    response.set('Cache-Control', 'no-store').json({ expired: result.expired, demoReset: Boolean(result.reset) })
  }
  return { daily }
}
