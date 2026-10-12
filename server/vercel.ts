import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.ts'
import { createPrismaClient, initializeDatabase } from './db.ts'
import { resolveDatabaseTarget } from './config/database-file.ts'

// The Express app as one Vercel Function, bundled by scripts/vercel-build.ts. Vercel's CDN serves the built client;
// /api/* and /uploads/* are routed here. The database is Turso and files live in Vercel Blob: the function's own disk is
// read-only and forgets everything between calls, so it refuses to start without them. The sample session photos the
// album zip and the demo reset read are copied beside this bundle.
const bundleDir = fileURLToPath(new URL('.', import.meta.url))
const target = resolveDatabaseTarget()
if (target.local) throw new Error('TURSO_DATABASE_URL must be set on Vercel')
if (!process.env.BLOB_READ_WRITE_TOKEN || !process.env.PRIVATE_BLOB_READ_WRITE_TOKEN) throw new Error('Both Vercel Blob tokens must be set on Vercel')

const prisma = createPrismaClient(target)
// A database that cannot be reached is reported once per instance; each request then fails on its own query.
const ready = initializeDatabase(prisma, { local: false }).catch(error => console.error('Database initialization failed', error instanceof Error ? error.message : error))
const scratch = resolve(tmpdir(), 'stc')
const app = createApp({ prisma, mode: 'production', publicDir: bundleDir, uploadsDir: resolve(scratch, 'uploads'), privateDir: resolve(scratch, 'private'), serveClient: false })

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  await ready
  app(request, response)
}
