import { randomBytes } from 'node:crypto'
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { basename, resolve, sep } from 'node:path'
import type { PhotoKind } from './photo-image.ts'

// Session photos are public: they live under <uploadsDir>/sessions/<sessionId>/<random>.<ext> and are served at
// /uploads/sessions/... The backup copies the uploads folder with the database.
export const UPLOADED_PREFIX = '/uploads/sessions/'

const sessionIdPattern = /^[a-z0-9]{1,64}$/
const fileNamePattern = /^[a-f0-9]{32}\.(?:jpg|png|webp)$/

function sessionDir(uploadsDir: string, sessionId: string) {
  if (!sessionIdPattern.test(sessionId)) throw new Error('Invalid session id for photo storage')
  return resolve(uploadsDir, 'sessions', sessionId)
}

// Writes under a temporary name and renames it into place, so a half-written photo is never served.
export function storePhoto(uploadsDir: string, sessionId: string, bytes: Buffer, kind: PhotoKind) {
  const dir = sessionDir(uploadsDir, sessionId)
  mkdirSync(dir, { recursive: true })
  const fileName = `${randomBytes(16).toString('hex')}.${kind.extension}`
  const target = resolve(dir, fileName)
  writeFileSync(`${target}.part`, bytes, { flag: 'wx' })
  renameSync(`${target}.part`, target)
  return `${UPLOADED_PREFIX}${sessionId}/${fileName}`
}

// The file behind a photo url, or null for seeded sample photos (under /photos), which this feature never touches.
export function uploadedPhotoPath(uploadsDir: string, url: string) {
  if (!url.startsWith(UPLOADED_PREFIX)) return null
  const [sessionId, fileName, ...rest] = url.slice(UPLOADED_PREFIX.length).split('/')
  if (rest.length || !fileName || !fileNamePattern.test(fileName) || basename(fileName) !== fileName) return null
  const dir = sessionDir(uploadsDir, sessionId)
  const path = resolve(dir, fileName)
  return path.startsWith(dir + sep) ? path : null
}

export function removePhotoFile(uploadsDir: string, url: string) {
  const path = uploadedPhotoPath(uploadsDir, url)
  if (path) rmSync(path, { force: true })
}
