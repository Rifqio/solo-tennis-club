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
