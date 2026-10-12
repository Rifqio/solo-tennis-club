import { randomBytes } from 'node:crypto'
import type { FileStore } from '../../storage/file-store.ts'
import type { PhotoKind } from './photo-image.ts'

// Session photos are public: they are stored under sessions/<sessionId>/<random>.<ext> in the public store and
// served at /uploads/sessions/... Locally that store is the uploads folder the backup copies with the database.
export const UPLOADED_PREFIX = '/uploads/sessions/'

const sessionIdPattern = /^[a-z0-9]{1,64}$/
const fileNamePattern = /^[a-f0-9]{32}\.(?:jpg|png|webp)$/

export async function storePhoto(files: FileStore, sessionId: string, bytes: Buffer, kind: PhotoKind) {
  if (!sessionIdPattern.test(sessionId)) throw new Error('Invalid session id for photo storage')
  const fileName = `${randomBytes(16).toString('hex')}.${kind.extension}`
  await files.put(`sessions/${sessionId}/${fileName}`, bytes, kind.contentType)
  return `${UPLOADED_PREFIX}${sessionId}/${fileName}`
}

// The storage key behind a photo url, or null for seeded sample photos (under /photos), which this feature never touches.
export function uploadedPhotoKey(url: string) {
  if (!url.startsWith(UPLOADED_PREFIX)) return null
  const [sessionId, fileName, ...rest] = url.slice(UPLOADED_PREFIX.length).split('/')
  if (rest.length || !sessionId || !sessionIdPattern.test(sessionId) || !fileName || !fileNamePattern.test(fileName)) return null
  return `sessions/${sessionId}/${fileName}`
}

export async function removePhotoFiles(files: FileStore, urls: string[]) {
  await files.remove(urls.flatMap(url => uploadedPhotoKey(url) ?? []))
}
