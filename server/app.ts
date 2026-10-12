import express from 'express'
import type { RequestHandler } from 'express'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PrismaClient } from './generated/prisma/client.ts'
import { createPublicRouter } from './features/public/public.router.ts'
import { createPublicPhotoRouter } from './features/session-photos/session-photo.router.ts'
import { ApiError, errorHandler } from './http/errors.ts'
import { readRuntimeConfig } from './config/runtime-config.ts'
import { createAdminRouter } from './features/admin/admin.router.ts'
import { createCustomerAuthRouter } from './features/customer/auth/customer-auth.router.ts'
import { createClientErrorsRouter } from './features/client-errors/client-errors.router.ts'
import { resolvePrivateDir, resolveUploadsDir } from './config/database-file.ts'
import { createFileStores, type FileStores } from './storage/file-store.ts'
import { createCronRouter } from './features/cron/cron.router.ts'
import { createAppConfigController } from './features/public/app-config.controller.ts'

export function createApp({ prisma, mode = 'production', distDir = resolve('dist'), publicDir = mode === 'development' ? resolve('public') : distDir, viteMiddleware, developmentOrigins = [], uploadsDir = resolveUploadsDir(), privateDir = resolvePrivateDir(), files = createFileStores({ uploadsDir, privateDir }) }: {
  prisma: PrismaClient; mode?: 'development' | 'production'; distDir?: string; publicDir?: string; viteMiddleware?: RequestHandler; developmentOrigins?: string[]; uploadsDir?: string; privateDir?: string; files?: FileStores
}) {
  const app = express()
  app.disable('x-powered-by')
  const config = readRuntimeConfig(mode)
  if (mode === 'development') config.developmentOrigins = developmentOrigins
  if (config.trustProxy) app.set('trust proxy', 1)
  app.use('/api/admin', createAdminRouter({ prisma, config, files }))
  app.use('/api/customer', createCustomerAuthRouter(prisma, config, files))
  app.use(express.json({ limit: '32kb' }))
  // Seeded sample photos ship in public/ (development) or dist/ (production build); the album zip reads them there.
  app.use('/api/public', createPublicPhotoRouter(prisma, files, publicDir))
  app.use('/api/public', createPublicRouter({ prisma }))
  app.get('/api/public/app-config', createAppConfigController(config).read)
  app.use('/api/cron', createCronRouter(prisma, { demo: Boolean(config.demo), files, publicDir, secret: process.env.CRON_SECRET }))
  app.use('/api/client-errors', createClientErrorsRouter(config))
  app.use('/api', (_request, _response, next) => next(new ApiError(404, 'NOT_FOUND')))
  // Uploaded portraits and session photos: read-only files with random names, so they can be cached for a long time.
  // On the hosted demo they live in public Blob, and /uploads/... redirects there.
  app.use('/uploads', ...uploadsHandlers(files, uploadsDir), (_request, _response, next) => next(new ApiError(404, 'NOT_FOUND')))
  if (mode === 'development' && viteMiddleware) app.use(viteMiddleware)
  else if (existsSync(resolve(distDir, 'index.html'))) {
    app.use(express.static(distDir))
    app.get('/{*path}', (_request, response) => response.sendFile(resolve(distDir, 'index.html')))
  } else console.warn('Production dist missing; API remains available')
  app.use(errorHandler)
  return app
}

function uploadsHandlers(files: FileStores, uploadsDir: string): RequestHandler[] {
  if (files.publicFiles.kind === 'disk') return [express.static(uploadsDir, { index: false, dotfiles: 'deny', maxAge: '30d', immutable: true })]
  return [(request, response, next) => {
    let url: string | null
    try { url = files.publicFiles.publicUrl(request.path.slice(1)) } catch { url = null }
    if (!url || (request.method !== 'GET' && request.method !== 'HEAD')) return next()
    response.set('Cache-Control', 'public, max-age=2592000, immutable').redirect(308, url)
  }]
}
