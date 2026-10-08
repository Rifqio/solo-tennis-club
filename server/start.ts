import { createServer } from 'node:http'
import type { ViteDevServer } from 'vite'
import { createApp } from './app.ts'
import { createPrismaClient, initializeDatabase } from './db.ts'
import { projectRoot, resolveDatabaseFile } from './config/database-file.ts'
import { resolve } from 'node:path'

export async function startServer(options: {
  mode: 'development' | 'production'; port?: number; host?: string; databaseFile?: string
}) {
  const prisma = createPrismaClient(resolveDatabaseFile(options.databaseFile))
  let vite: ViteDevServer | undefined
  try {
    await initializeDatabase(prisma)
    if (options.mode === 'development') {
      const { createServer: createViteServer } = await import('vite')
      vite = await createViteServer({ root: projectRoot, server: { middlewareMode: true }, appType: 'spa' })
    }
    const app = createApp({ prisma, mode: options.mode, distDir: resolve(projectRoot, 'dist'), viteMiddleware: vite?.middlewares })
    const server = createServer(app)
    const port = options.port ?? Number(process.env.LAFU_PORT ?? 3000)
    const host = options.host ?? process.env.LAFU_HOST ?? '127.0.0.1'
    await new Promise<void>((resolveListen, reject) => {
      server.once('error', reject)
      server.listen(port, host, () => { server.off('error', reject); resolveListen() })
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Server address unavailable')
    let closing: Promise<void> | undefined
    const close = () => closing ??= (async () => {
      process.off('SIGINT', onSignal)
      process.off('SIGTERM', onSignal)
      await new Promise<void>((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose()))
      await vite?.close()
      await prisma.$disconnect()
    })()
    const onSignal = () => { void close().catch(error => { console.error(error); process.exitCode = 1 }) }
    process.once('SIGINT', onSignal)
    process.once('SIGTERM', onSignal)
    const url = 'http://' + host + ':' + address.port
    console.log('Lafu listening on ' + url)
    return { url, close }
  } catch (error) {
    await vite?.close()
    await prisma.$disconnect()
    throw error
  }
}
