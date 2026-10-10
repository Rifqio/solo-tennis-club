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
export function databaseUrl(file = resolveDatabaseFile()): string {
  return 'file:' + resolve(file).replaceAll('\\', '/')
}
