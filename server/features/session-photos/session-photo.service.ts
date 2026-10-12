import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import { inWriteTransaction } from '../../database/transaction.ts'
import { ApiError } from '../../http/errors.ts'
import { clubDateOf, clubTimeOf } from '../../../shared/club-time.ts'
import {
  PHOTO_REMINDER_DAYS, SESSION_PHOTO_MAX_BYTES, SESSION_PHOTOS_MAX,
  type AdminAlbumResponse, type AdminSessionPhoto, type AlbumSession, type PublicAlbumResponse, type RecentAlbumsResponse,
} from '../../../shared/api/session-photos.ts'
import { photoSize, sniffPhoto } from './photo-image.ts'
import { removePhotoFile, storePhoto, uploadedPhotoPath } from './photo-storage.ts'
import { createSessionPhotoRepository } from './session-photo.repository.ts'
import type { AlbumSessionRow, SessionPhotoRow } from './session-photo.repository.ts'
import type { ZipEntry } from './zip-writer.ts'

// Urungkan is offered for six seconds; a deleted photo is kept for an hour before its file goes.
const UNDO_WINDOW_MS = 60 * 60 * 1000
const MAX_IDS = SESSION_PHOTOS_MAX

export function toAlbumSession(row: AlbumSessionRow): AlbumSession {
  const endsAt = new Date(row.startsAt.getTime() + row.durationMinutes * 60_000)
  return {
    id: row.id, className: row.class.name, levelName: row.level.name, venueName: row.venue.name,
    date: clubDateOf(row.startsAt), startTime: clubTimeOf(row.startsAt), endTime: clubTimeOf(endsAt),
    startsAt: row.startsAt.toISOString(), isSample: row.isSample,
  }
}

const toPhoto = (row: SessionPhotoRow) => ({ id: row.id, url: row.url, width: row.width, height: row.height })

// The cover is the photo the admin chose, else the first one.
function coverOf(rows: SessionPhotoRow[]) {
  return rows.find(row => row.isCover) ?? rows[0] ?? null
}

function readIds(body: unknown): string[] {
  const ids = (body as { photoIds?: unknown } | null)?.photoIds
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_IDS || !ids.every(id => typeof id === 'string' && id.length <= 64)) {
    throw new ApiError(400, 'VALIDATION_FAILED', { photoIds: 'INVALID_FORMAT' })
  }
  return [...new Set(ids as string[])]
}

async function requireSession(database: PrismaClient, id: string) {
  const session = await createSessionPhotoRepository(database).findSession(id)
  if (!session) throw new ApiError(404, 'NOT_FOUND')
  return session
}

export async function getAdminAlbum(database: PrismaClient, sessionId: string): Promise<AdminAlbumResponse> {
  const session = await requireSession(database, sessionId)
  const rows = await createSessionPhotoRepository(database).listPhotos(sessionId)
  const cover = coverOf(rows)
  return {
    session: { ...toAlbumSession(session), cancelled: session.status !== 'scheduled' },
    photos: rows.map((row): AdminSessionPhoto => ({ ...toPhoto(row), isCover: row.id === cover?.id })),
    maxPhotos: SESSION_PHOTOS_MAX,
  }
}

// One photo per request, so each tile shows its own progress and a failed one is retried alone.
export async function addSessionPhoto(database: PrismaClient, uploadsDir: string, sessionId: string, bytes: Buffer | undefined, adminId: string | null) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) throw new ApiError(400, 'VALIDATION_FAILED', { photo: 'REQUIRED' })
  if (bytes.length > SESSION_PHOTO_MAX_BYTES) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', { photo: 'TOO_LONG' })
  const kind = sniffPhoto(bytes)
  const size = kind && photoSize(bytes, kind)
  if (!kind || !size) throw new ApiError(400, 'VALIDATION_FAILED', { photo: 'INVALID_FORMAT' })
  const session = await requireSession(database, sessionId)
  if (session.status !== 'scheduled') throw new ApiError(409, 'SESSION_CHANGED')
  const url = storePhoto(uploadsDir, sessionId, bytes, kind)
  try {
    const row = await inWriteTransaction(database, async transaction => {
      const repository = createSessionPhotoRepository(transaction)
      if (await repository.countPhotos(sessionId) >= SESSION_PHOTOS_MAX) throw new ApiError(409, 'VALIDATION_FAILED', { photo: 'OUT_OF_RANGE' })
      return repository.createPhoto({ sessionId, url, ...size, byteSize: bytes.length, position: await repository.nextPosition(sessionId), uploadedById: adminId })
    })
    return { ...toPhoto(row), isCover: false }
  } catch (error) {
    removePhotoFile(uploadsDir, url)
    throw error
  }
}

export async function setAlbumCover(database: PrismaClient, sessionId: string, body: unknown) {
  const photoId = (body as { photoId?: unknown } | null)?.photoId
  if (typeof photoId !== 'string' || photoId.length > 64) throw new ApiError(400, 'VALIDATION_FAILED', { photoId: 'INVALID_FORMAT' })
  await requireSession(database, sessionId)
  const changed = await inWriteTransaction(database, transaction => createSessionPhotoRepository(transaction).setCover(sessionId, photoId))
  if (changed.count === 0) throw new ApiError(404, 'NOT_FOUND')
  return getAdminAlbum(database, sessionId)
}

// Deleting hides the photos at once and keeps them for Urungkan; older deletions are purged on the way.
export async function deleteAlbumPhotos(database: PrismaClient, uploadsDir: string, sessionId: string, body: unknown, now = new Date()) {
  const ids = readIds(body)
  await requireSession(database, sessionId)
  const purged = await inWriteTransaction(database, async transaction => {
    const repository = createSessionPhotoRepository(transaction)
    await repository.markDeleted(sessionId, ids, now)
    return repository.purgeDeleted(new Date(now.getTime() - UNDO_WINDOW_MS))
  })
  for (const row of purged) removePhotoFile(uploadsDir, row.url)
  return getAdminAlbum(database, sessionId)
}

export async function restoreAlbumPhotos(database: PrismaClient, sessionId: string, body: unknown, now = new Date()) {
  const ids = readIds(body)
  await requireSession(database, sessionId)
  await inWriteTransaction(database, transaction => createSessionPhotoRepository(transaction).restore(sessionId, ids, new Date(now.getTime() - UNDO_WINDOW_MS)))
  return getAdminAlbum(database, sessionId)
}

// Public: a cancelled session has no album.
export async function getPublicAlbum(database: PrismaClient, sessionId: string): Promise<PublicAlbumResponse> {
  const session = await requireSession(database, sessionId)
  if (session.status !== 'scheduled') throw new ApiError(404, 'NOT_FOUND')
  const rows = await createSessionPhotoRepository(database).listPhotos(sessionId)
  const latest = rows.reduce<Date | null>((max, row) => !max || row.createdAt > max ? row.createdAt : max, null)
  return { session: toAlbumSession(session), photos: rows.map(toPhoto), coverId: coverOf(rows)?.id ?? null, updatedAt: latest?.toISOString() ?? null }
}

export async function listRecentAlbums(database: PrismaClient, limit: number): Promise<RecentAlbumsResponse> {
  const albums = await createSessionPhotoRepository(database).listRecentAlbums(Math.min(Math.max(1, limit), 48))
  return { albums: albums.map(album => ({ session: toAlbumSession(album.session), count: album.count, cover: toPhoto(album.cover) })) }
}

// The admin's reminder: the newest session that finished in the last week and still has no photos.
export async function findPhotoReminder(database: PrismaClient, now = new Date()): Promise<AlbumSession | null> {
  const from = new Date(now.getTime() - PHOTO_REMINDER_DAYS * 24 * 60 * 60_000)
  const rows = await createSessionPhotoRepository(database).findSessionWithoutPhotos(from, now)
  const ended = rows.find(row => row.startsAt.getTime() + row.durationMinutes * 60_000 <= now.getTime())
  return ended ? toAlbumSession(ended) : null
}

// Every photo of the album, read one at a time, named "<class> <date> 01.jpg" and so on.
export async function albumZip(database: PrismaClient, uploadsDir: string, publicDir: string, sessionId: string) {
  const album = await getPublicAlbum(database, sessionId)
  if (!album.photos.length) throw new ApiError(404, 'NOT_FOUND')
  const base = `${album.session.className} ${album.session.date}`.replace(/[^\p{L}\p{N} -]+/gu, '').trim().slice(0, 80) || 'album'
  const pad = String(album.photos.length).length
  async function* entries(): AsyncGenerator<ZipEntry> {
    for (const [index, photo] of album.photos.entries()) {
      const path = uploadedPhotoPath(uploadsDir, photo.url) ?? seededPhotoPath(publicDir, photo.url)
      if (!path) continue
      const bytes = await readFile(path).catch(() => null)
      if (!bytes) continue
      const extension = sniffPhoto(bytes)?.extension ?? 'jpg'
      yield { name: `${base} ${String(index + 1).padStart(pad, '0')}.${extension}`, bytes, modified: new Date(album.session.startsAt) }
    }
  }
  return { fileName: `${base}.zip`, entries: entries() }
}

// Seeded sample photos ship with the app under public/photos/sessions.
function seededPhotoPath(publicDir: string, url: string) {
  const match = /^\/photos\/sessions\/([a-z0-9-]+\.(?:webp|jpg|png))$/.exec(url)
  return match ? resolve(publicDir, 'photos', 'sessions', match[1]) : null
}
