import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { build, type Plugin } from 'esbuild'

// Builds the Vercel deployment with the Build Output API (https://vercel.com/docs/build-output-api): the Vite client
// as static files on the CDN, and the Express app bundled into one Node function that receives /api/* and /uploads/*.
// Vercel runs this as the build command and deploys .vercel/output as it is.
const output = resolve('.vercel/output')
const functionDir = resolve(output, 'functions/api.func')

// The function talks to Turso over HTTP with libSQL's web client, so no native database driver ships with it.
// better-sqlite3 (local files only) is replaced by a stub that explains itself if it is ever reached.
const serverlessDrivers: Plugin = {
  name: 'serverless-drivers',
  setup(builder) {
    builder.onResolve({ filter: /^@prisma\/adapter-libsql$/ }, args => builder.resolve('@prisma/adapter-libsql/web', { kind: args.kind, resolveDir: args.resolveDir }))
    builder.onResolve({ filter: /^@prisma\/adapter-better-sqlite3$/ }, () => ({ path: 'better-sqlite3-stub', namespace: 'stub' }))
    builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: "export class PrismaBetterSqlite3 { constructor() { throw new Error('Local SQLite files are not available on Vercel; set TURSO_DATABASE_URL') } }",
      loader: 'js',
    }))
  },
}

rmSync(output, { recursive: true, force: true })
execSync('npm run build', { stdio: 'inherit' })

// Vercel passes the project's environment variables to the build, so the Turso database is brought up to date here:
// pending migrations are applied (repeat-safe), and on the demo the sample club is seeded once (later runs skip it;
// the nightly reset keeps it fresh). Seeding refuses NODE_ENV=production, which is meant for a real club's data.
if (process.env.TURSO_DATABASE_URL) {
  execSync('npx tsx scripts/db-migrate-turso.ts', { stdio: 'inherit' })
  // A failed seed never blocks a deploy: the nightly reset seeds the demo too. A failed migration does.
  if (process.env.LAFU_DEMO === '1') {
    try { execSync('npx tsx scripts/seed-sample.ts', { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'development' } }) }
    catch { console.warn('Sample seeding failed (see above); deploying anyway.') }
  }
}

cpSync(resolve('dist'), resolve(output, 'static'), { recursive: true })

await build({
  entryPoints: [resolve('server/vercel.ts')],
  outfile: resolve(functionDir, 'index.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  legalComments: 'none',
  logLevel: 'info',
  plugins: [serverlessDrivers],
  // CommonJS packages (Express and friends) inside an ES module bundle still call require and read __dirname.
  banner: { js: "import { createRequire as __createRequire } from 'node:module'; import { fileURLToPath as __fileURLToPath } from 'node:url'; const require = __createRequire(import.meta.url); const __filename = __fileURLToPath(import.meta.url); const __dirname = __fileURLToPath(new URL('.', import.meta.url));" },
})
// The seeded sample photos, read by the album zip and the demo reset.
cpSync(resolve('public/photos/sessions'), resolve(functionDir, 'photos/sessions'), { recursive: true })
writeFileSync(resolve(functionDir, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', shouldAddHelpers: false, maxDuration: 60,
  // Mumbai, beside the Turso database (also bom1), so each query stays in one region.
  regions: ['bom1'],
}, null, 2))

mkdirSync(output, { recursive: true })
writeFileSync(resolve(output, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    // Hashed build assets never change; everything else revalidates.
    { src: '^/assets/(.*)$', headers: { 'cache-control': 'public, max-age=31536000, immutable' }, continue: true },
    { src: '^/(api|uploads)(/.*)?$', dest: '/api' },
    { handle: 'filesystem' },
    // The React router (and its 404 page) handle every other path.
    { src: '^/(.*)$', dest: '/index.html' },
  ],
  // Daily on the Hobby plan: 20:00 UTC is 03:00 in Solo (WIB), when the club is asleep.
  crons: [{ path: '/api/cron/daily', schedule: '0 20 * * *' }],
}, null, 2))
console.log('Vercel output written to ' + output)
