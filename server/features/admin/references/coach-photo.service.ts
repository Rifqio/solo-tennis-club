import { randomBytes } from 'node:crypto'
import type { FileStore } from '../../../storage/file-store.ts'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { COACH_PHOTO_MAX_BYTES, type ReferenceRecord } from '../../../../shared/api/admin-references.ts'
import { ApiError } from '../../../http/errors.ts'
import { createReferenceRepository } from './reference.repository.ts'
import { getReference } from './reference.service.ts'

const PHOTO_PREFIX = '/uploads/coaches/'

// The image kind from its first bytes, never from the file name or the declared type.
function sniffImage(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: 'jpg', contentType: 'image/jpeg' }
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { extension: 'png', contentType: 'image/png' }
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return { extension: 'webp', contentType: 'image/webp' }
  return null
}

// Only files this feature wrote are ever removed; seeded photos under /photos are left alone.
async function removeUploaded(files: FileStore, photoUrl: string | null) {
  const fileName = photoUrl?.startsWith(PHOTO_PREFIX) ? photoUrl.slice(PHOTO_PREFIX.length) : ''
  if (/^[a-z0-9]+-[a-f0-9]{12}\.(?:jpg|png|webp)$/.test(fileName)) await files.remove([`coaches/${fileName}`])
}

// Stores a coach's portrait under coaches/ in the public store with a random name and points the coach at it.
export async function saveCoachPhoto(database: PrismaClient, id: string, bytes: Buffer | undefined, files: FileStore): Promise<ReferenceRecord> {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) throw new ApiError(400, 'VALIDATION_FAILED', { photo: 'REQUIRED' })
  if (bytes.length > COACH_PHOTO_MAX_BYTES) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', { photo: 'TOO_LONG' })
  const kind = sniffImage(bytes)
  if (!kind) throw new ApiError(400, 'VALIDATION_FAILED', { photo: 'INVALID_FORMAT' })
  const repository = createReferenceRepository(database, 'coach')
  const coach = await repository.findById(id)
  if (!coach) throw new ApiError(404, 'NOT_FOUND')
  const file = `${id}-${randomBytes(6).toString('hex')}.${kind.extension}`
  await files.put(`coaches/${file}`, bytes, kind.contentType)
  await repository.setPhoto(id, PHOTO_PREFIX + file)
  await removeUploaded(files, 'photoUrl' in coach ? coach.photoUrl : null)
  return getReference(database, 'coach', id)
}

export async function removeCoachPhoto(database: PrismaClient, id: string, files: FileStore): Promise<ReferenceRecord> {
  const repository = createReferenceRepository(database, 'coach')
  const coach = await repository.findById(id)
  if (!coach) throw new ApiError(404, 'NOT_FOUND')
  await repository.setPhoto(id, null)
  await removeUploaded(files, 'photoUrl' in coach ? coach.photoUrl : null)
  return getReference(database, 'coach', id)
}
