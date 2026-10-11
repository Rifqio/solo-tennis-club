import express from 'express'
import type { RequestHandler } from 'express'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PrismaClient } from './generated/prisma/client.ts'
import { createPublicRouter } from './features/public/public.router.ts'
import { ApiError, errorHandler } from './http/errors.ts'
import { readRuntimeConfig } from './config/runtime-config.ts'
import { createAdminRouter } from './features/admin/admin.router.ts'
import { createCustomerAuthRouter } from './features/customer/auth/customer-auth.router.ts'
import { resolvePrivateDir, resolveUploadsDir } from './config/database-file.ts'

export function createApp({ prisma, mode = 'production', distDir = resolve('dist'), viteMiddleware, developmentOrigins = [], uploadsDir = resolveUploadsDir(), privateDir = resolvePrivateDir() }: {
  prisma: PrismaClient; mode?: 'development' | 'production'; distDir?: string; viteMiddleware?: RequestHandler; developmentOrigins?: string[]; uploadsDir?: string; privateDir?: string
}) {
  const app = express()
  app.disable('x-powered-by')
  const config = readRuntimeConfig(mode)
  if (mode === 'development') config.developmentOrigins = developmentOrigins
  if (config.trustProxy) app.set('trust proxy', 1)
  app.use('/api/admin', createAdminRouter({ prisma, config, uploadsDir, privateDir }))
  app.use('/api/customer', createCustomerAuthRouter(prisma, config, privateDir))
  app.use(express.json({ limit: '32kb' }))
  app.use('/api/public', createPublicRouter({ prisma }))
  app.use('/api', (_request, _response, next) => next(new ApiError(404, 'NOT_FOUND')))
  // Uploaded portraits: read-only files with random names, so they can be cached for a long time.
  app.use('/uploads', express.static(uploadsDir, { index: false, dotfiles: 'deny', maxAge: '30d', immutable: true }), (_request, _response, next) => next(new ApiError(404, 'NOT_FOUND')))
  if (mode === 'development' && viteMiddleware) app.use(viteMiddleware)
  else if (existsSync(resolve(distDir, 'index.html'))) {
    app.use(express.static(distDir))
    app.get('/{*path}', (_request, response) => response.sendFile(resolve(distDir, 'index.html')))
  } else console.warn('Production dist missing; API remains available')
  app.use(errorHandler)
  return app
}
