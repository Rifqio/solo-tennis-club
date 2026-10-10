import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import type { PrismaClient } from '../generated/prisma/client.ts'
import { projectRoot } from '../config/database-file.ts'
import { createPrismaClient } from '../db.ts'
import { clubDateOf } from '../../shared/club-time.ts'

const FORBIDDEN_DIRS = ['dist', 'public'].map(name => resolve(projectRoot, name))

function isInside(child: string, parent: string) {
  const path = relative(parent, child)
  return path === '' || (!!path && !path.startsWith('..' + sep) && path !== '..' && !isAbsolute(path))
}

// Backups and restores never land where the web server serves files.
function assertWritableLocation(path: string) {
  const absolute = resolve(path)
  if (FORBIDDEN_DIRS.some(dir => isInside(absolute, dir))) throw new Error('Refusing to write a database inside dist/ or public/: ' + absolute)
  return absolute
}

export function resolveBackupDir(input = process.env.LAFU_BACKUP_DIR) {
  return assertWritableLocation(resolve(projectRoot, input || 'backups'))
}

// lafu-YYYYMMDD-HHmmss-WIB.db, stamped in club time so operators read the same clock as the schedule.
function backupFileName(now: Date) {
  const wib = new Date(now.getTime() + 7 * 3_600_000).toISOString()
  return `lafu-${clubDateOf(now).replaceAll('-', '')}-${wib.slice(11, 13)}${wib.slice(14, 16)}${wib.slice(17, 19)}-WIB.db`
}

// VACUUM INTO writes a consistent snapshot through SQLite itself, including committed WAL pages,
// while the server keeps running. Copying the live file could miss data still in the WAL.
export async function backupDatabase(prisma: PrismaClient, backupDir = resolveBackupDir(), now = new Date()) {
  const dir = assertWritableLocation(backupDir)
  mkdirSync(dir, { recursive: true })
  let target = resolve(dir, backupFileName(now))
  for (let attempt = 1; existsSync(target); attempt++) target = resolve(dir, backupFileName(now).replace('.db', `-${attempt}.db`))
  await prisma.$executeRaw`VACUUM INTO ${target}`
  return target
}

// Uploaded files (coach portraits) are copied beside the database snapshot as <backup name>-uploads/.
export function backupUploads(uploadsDir: string, backupFile: string) {
  if (!existsSync(uploadsDir)) return null
  const target = assertWritableLocation(backupFile.replace(/\.db$/, '') + '-uploads')
  cpSync(uploadsDir, target, { recursive: true })
  return target
}

export async function verifyBackup(file: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!existsSync(file) || !statSync(file).isFile()) return { ok: false, reason: 'Backup file not found' }
  const prisma = createPrismaClient(file)
  try {
    const integrity = await prisma.$queryRawUnsafe<Array<{ integrity_check: string }>>('PRAGMA integrity_check')
    if (integrity[0]?.integrity_check !== 'ok') return { ok: false, reason: 'Integrity check failed' }
    const applied = await prisma.$queryRawUnsafe<Array<{ migration_name: string; finished_at: unknown }>>('SELECT migration_name, finished_at FROM _prisma_migrations')
    const finished = new Set(applied.filter(row => row.finished_at !== null).map(row => row.migration_name))
    const expected = readdirSync(resolve(projectRoot, 'prisma/migrations'), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name)
    const missing = expected.filter(name => !finished.has(name))
    if (missing.length) return { ok: false, reason: 'Missing migrations: ' + missing.join(', ') }
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: 'Not a readable STC database: ' + (error instanceof Error ? error.message : String(error)) }
  } finally {
    await prisma.$disconnect()
  }
}

export async function restoreDatabase({ from, to, force = false }: { from: string; to: string; force?: boolean }) {
  const source = resolve(from)
  const target = assertWritableLocation(to)
  const verdict = await verifyBackup(source)
  if (!verdict.ok) throw new Error('Backup failed verification: ' + verdict.reason)
  if (existsSync(target) && !force) throw new Error('Target exists; pass --force to replace it: ' + target)
  mkdirSync(dirname(target), { recursive: true })
  // Copy beside the target first, then rename, so a crash never leaves a half-written database in place.
  const staging = target + '.restoring'
  copyFileSync(source, staging)
  renameSync(staging, target)
  for (const suffix of ['-wal', '-shm', '-journal']) rmSync(target + suffix, { force: true })
  return target
}
