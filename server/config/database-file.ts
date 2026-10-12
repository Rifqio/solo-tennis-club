import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url))
export function resolveDatabaseFile(input = process.env.LAFU_DATABASE_FILE): string {
  const file = resolve(projectRoot, input || 'data/lafu.db')
  mkdirSync(dirname(file), { recursive: true })
  return file
}
// Uploaded files (coach portraits) live beside the database, so a backup can carry both.
export function resolveUploadsDir(databaseFile = resolveDatabaseFile()): string {
  return resolve(dirname(databaseFile), 'uploads')
}
// Private files (payment proofs) also live beside the database, never under a folder that is served publicly.
export function resolvePrivateDir(databaseFile = resolveDatabaseFile()): string {
  return resolve(dirname(databaseFile), 'private')
}
export function databaseUrl(file = resolveDatabaseFile()): string {
  return 'file:' + resolve(file).replaceAll('\\', '/')
}

export interface DatabaseTarget { url: string; authToken?: string; local: boolean }

// Turso when TURSO_DATABASE_URL is set (the hosted demo), otherwise the local SQLite file.
export function resolveDatabaseTarget(): DatabaseTarget {
  const remote = process.env.TURSO_DATABASE_URL
  if (remote) return { url: remote, authToken: process.env.TURSO_AUTH_TOKEN, local: false }
  return { url: databaseUrl(), local: true }
}
