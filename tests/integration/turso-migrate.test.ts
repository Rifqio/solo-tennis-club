import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import Database from 'better-sqlite3'
import { expect, inject, test } from 'vitest'
import { projectRoot } from '../../server/config/database-file.ts'

// The Turso migration script, run against a local file, must build exactly the schema `prisma migrate deploy` builds
// (the run's template database) and record the same migrations with the same checksums, and be safe to run twice.
test('the Turso migration script matches prisma migrate deploy and is repeat-safe', () => {
  const root = resolve(tmpdir(), 'stc-tests')
  mkdirSync(root, { recursive: true })
  const file = resolve(root, 'turso-' + randomUUID() + '.db')
  const run = () => execFileSync(process.execPath, [resolve(projectRoot, 'node_modules/tsx/dist/cli.mjs'), 'scripts/db-migrate-turso.ts'], {
    cwd: projectRoot, env: { ...process.env, TURSO_DATABASE_URL: 'file:' + file.replaceAll('\\', '/') }, encoding: 'utf8', timeout: 60000,
  })
  try {
    expect(run()).toContain('migrations applied')
    expect(run()).toContain('already up to date')
    const read = (path: string) => {
      const database = new Database(path, { readonly: true })
      try {
        const schema = database.prepare("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name").all() as Array<{ type: string; name: string; sql: string | null }>
        const migrations = database.prepare('SELECT migration_name, checksum FROM _prisma_migrations ORDER BY migration_name').all()
        return { schema: schema.map(row => ({ ...row, sql: (row.sql ?? '').replace(/\s+/g, ' ').trim() })), migrations }
      } finally { database.close() }
    }
    const fromScript = read(file)
    const fromPrisma = read(inject('templateDatabaseFile'))
    expect(fromScript.schema).toEqual(fromPrisma.schema)
    expect(fromScript.migrations).toEqual(fromPrisma.migrations)
  } finally {
    for (const suffix of ['', '-wal', '-shm']) rmSync(file + suffix, { force: true })
  }
})
