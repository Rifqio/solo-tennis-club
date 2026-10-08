import express from 'express'
import type { RequestHandler } from 'express'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PrismaClient } from './generated/prisma/client.ts'
import { createPublicRouter } from './features/public/public.router.ts'
import { ApiError, errorHandler } from './http/errors.ts'

export function createApp({ prisma, mode = 'production', distDir = resolve('dist'), viteMiddleware }: {
  prisma: PrismaClient; mode?: 'development' | 'production'; distDir?: string; viteMiddleware?: RequestHandler
}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '32kb' }))
  app.use('/api/public', createPublicRouter({ prisma }))
  app.use('/api', (_request, _response, next) => next(new ApiError(404, 'NOT_FOUND')))
  if (mode === 'development' && viteMiddleware) app.use(viteMiddleware)
  else if (existsSync(resolve(distDir, 'index.html'))) {
    app.use(express.static(distDir))
    app.get('/{*path}', (_request, response) => response.sendFile(resolve(distDir, 'index.html')))
  } else console.warn('Production dist missing; API remains available')
  app.use(errorHandler)
  return app
}
