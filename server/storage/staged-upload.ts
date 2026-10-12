import { randomBytes } from 'node:crypto'
import type { Request } from 'express'
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client'
import { ApiError } from '../http/errors.ts'
import { COACH_PHOTO_MAX_BYTES } from '../../shared/api/admin-references.ts'
import { PROOF_CONTENT_TYPES, PROOF_FILE_MAX_BYTES } from '../../shared/api/customer-payments.ts'
import { SESSION_PHOTO_MAX_BYTES } from '../../shared/api/session-photos.ts'
import type { UploadPurpose, UploadTicketResponse } from '../../shared/api/uploads.ts'
import type { FileStore } from './file-store.ts'

// Direct browser uploads for the hosted demo. A Vercel Function accepts at most 4.5 MB per request, so the browser
// puts each file straight into the private Blob store under incoming/<purpose>/<random>.bin, with a token that allows
// only that key, the purpose's size cap and its types, for ten minutes. The API then takes the file back, checks its
// bytes exactly as it checks an uploaded body, stores it where it belongs and removes the incoming copy.
// Locally there is no token, the ticket says so, and the browser sends the file in the request as before.

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const LIMITS: Record<UploadPurpose, { maxBytes: number; contentTypes: readonly string[] }> = {
  photo: { maxBytes: SESSION_PHOTO_MAX_BYTES, contentTypes: IMAGE_TYPES },
  coach: { maxBytes: COACH_PHOTO_MAX_BYTES, contentTypes: IMAGE_TYPES },
  proof: { maxBytes: PROOF_FILE_MAX_BYTES, contentTypes: PROOF_CONTENT_TYPES },
}
const TICKET_MINUTES = 10
const incomingPattern = (purpose: UploadPurpose) => new RegExp(`^incoming/${purpose}/[a-f0-9]{32}\\.bin$`)

export async function issueUploadTicket(purpose: UploadPurpose, token = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN): Promise<UploadTicketResponse> {
  if (!token) return { direct: false }
  const key = `incoming/${purpose}/${randomBytes(16).toString('hex')}.bin`
  const { maxBytes, contentTypes } = LIMITS[purpose]
  const clientToken = await generateClientTokenFromReadWriteToken({
    token, pathname: key, maximumSizeInBytes: maxBytes, allowedContentTypes: [...contentTypes],
    validUntil: Date.now() + TICKET_MINUTES * 60_000, addRandomSuffix: false, allowOverwrite: false,
  })
  return { direct: true, key, token: clientToken, access: 'private' }
}

export function readUploadPurpose(body: unknown, allowed: UploadPurpose[]): UploadPurpose {
  const purpose = (body as { purpose?: unknown } | null)?.purpose
  if (typeof purpose !== 'string' || !allowed.includes(purpose as UploadPurpose)) throw new ApiError(400, 'VALIDATION_FAILED', { purpose: 'INVALID_FORMAT' })
  return purpose as UploadPurpose
}

export function isIncomingKey(purpose: UploadPurpose, key: unknown): key is string {
  return typeof key === 'string' && incomingPattern(purpose).test(key)
}

// Reads an uploaded file back and removes the incoming copy, whatever its checks decide next. A key that was never
// uploaded (or already taken) answers as a missing file.
export async function takeIncoming(files: FileStore, purpose: UploadPurpose, key: unknown, field: string): Promise<Buffer> {
  if (!isIncomingKey(purpose, key)) throw new ApiError(400, 'VALIDATION_FAILED', { [field]: 'INVALID_FORMAT' })
  const bytes = await files.read(key)
  await files.remove([key])
  if (!bytes) throw new ApiError(400, 'VALIDATION_FAILED', { [field]: 'REQUIRED' })
  return bytes
}

// The image body of a photo or portrait request: the bytes themselves locally, or { key } after a direct upload.
export async function readImageBody(request: Request, files: FileStore, purpose: 'photo' | 'coach'): Promise<Buffer | undefined> {
  if (request.is('application/json')) return takeIncoming(files, purpose, (request.body as { key?: unknown } | null)?.key, 'photo')
  return request.body as Buffer | undefined
}
