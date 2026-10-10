import { randomBytes } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { COACH_PHOTO_MAX_BYTES, type ReferenceRecord } from '../../../../shared/api/admin-references.ts'
import { ApiError } from '../../../http/errors.ts'
import { createReferenceRepository } from './reference.repository.ts'
import { getReference } from './reference.service.ts'

const PHOTO_PREFIX = '/uploads/coaches/'

// The image kind from its first bytes, never from the file name or the declared type.
function sniffImage(bytes: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp'
  return null
}

// Only files this feature wrote are ever removed; seeded photos under /photos are left alone.
function removeUploaded(uploadsDir: string, photoUrl: string | null) {
  if (!photoUrl?.startsWith(PHOTO_PREFIX)) return
  rmSync(resolve(uploadsDir, 'coaches', basename(photoUrl)), { force: true })
}

// Stores a coach's portrait under data/uploads/coaches with a random name and points the coach at it.
export async function saveCoachPhoto(database: PrismaClient, id: string, bytes: Buffer | undefined, uploadsDir: string): Promise<ReferenceRecord> {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) throw new ApiError(400, 'VALIDATION_FAILED', { photo: 'REQUIRED' })
  if (bytes.length > COACH_PHOTO_MAX_BYTES) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', { photo: 'TOO_LONG' })
  const extension = sniffImage(bytes)
  if (!extension) throw new ApiError(400, 'VALIDATION_FAILED', { photo: 'INVALID_FORMAT' })
  const repository = createReferenceRepository(database, 'coach')
  const coach = await repository.findById(id)
  if (!coach) throw new ApiError(404, 'NOT_FOUND')
  const dir = resolve(uploadsDir, 'coaches')
  mkdirSync(dir, { recursive: true })
  const file = `${id}-${randomBytes(6).toString('hex')}.${extension}`
  writeFileSync(resolve(dir, file), bytes)
  await repository.setPhoto(id, PHOTO_PREFIX + file)
  removeUploaded(uploadsDir, 'photoUrl' in coach ? coach.photoUrl : null)
  return getReference(database, 'coach', id)
}

export async function removeCoachPhoto(database: PrismaClient, id: string, uploadsDir: string): Promise<ReferenceRecord> {
  const repository = createReferenceRepository(database, 'coach')
  const coach = await repository.findById(id)
  if (!coach) throw new ApiError(404, 'NOT_FOUND')
  await repository.setPhoto(id, null)
  removeUploaded(uploadsDir, 'photoUrl' in coach ? coach.photoUrl : null)
  return getReference(database, 'coach', id)
}
