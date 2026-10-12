import { createHash, randomUUID } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@libsql/client'

// Prisma Migrate cannot apply migrations to Turso, so this applies the committed prisma/migrations/*/migration.sql
// files in order and records each in _prisma_migrations, the table Prisma itself keeps, with the same checksum.
// Usage: TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:migrate:turso
// (A local file works too: TURSO_DATABASE_URL=file:data/check.db, used to compare with `prisma migrate deploy`.)
const url = process.env.TURSO_DATABASE_URL
if (!url) {
  console.error('Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN for Turso).')
  process.exit(1)
}
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
const migrationsDir = resolve('prisma/migrations')

// Statements end with ";" at the end of a line in Prisma's output. The foreign-key pragmas are dropped because
// client.migrate already runs the batch with foreign keys off, then checks them before committing.
function statementsOf(sql: string) {
  return sql.split(/;\s*(?:\r?\n|$)/)
    .map(statement => statement.split(/\r?\n/).filter(line => !line.trimStart().startsWith('--')).join('\n').trim())
    .filter(statement => statement && !/^PRAGMA (?:defer_)?foreign_keys\s*=/i.test(statement))
}

try {
  await client.execute(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "checksum" TEXT NOT NULL,
    "finished_at" DATETIME,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
  )`)
  const applied = new Set((await client.execute('SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL')).rows.map(row => String(row.migration_name)))
  const pending = readdirSync(migrationsDir, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort().filter(name => !applied.has(name))
  for (const name of pending) {
    const sql = readFileSync(resolve(migrationsDir, name, 'migration.sql'), 'utf8')
    const statements = statementsOf(sql)
    const startedAt = new Date().toISOString()
    await client.migrate([
      ...statements,
      { sql: 'INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES (?, ?, ?, ?, ?, 1)',
        args: [randomUUID(), createHash('sha256').update(sql).digest('hex'), new Date().toISOString(), name, startedAt] },
    ])
    const broken = await client.execute('PRAGMA foreign_key_check')
    if (broken.rows.length) throw new Error(`${name} left ${broken.rows.length} foreign key problems`)
    console.log(`Applied ${name} (${statements.length} statements)`)
  }
  console.log(pending.length ? `${pending.length} migrations applied.` : 'Database already up to date.')
} catch (error) {
  console.error('Migration failed: ' + (error instanceof Error ? error.message : String(error)))
  process.exitCode = 1
} finally {
  client.close()
}
