import type { RequestHandler } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import {
  addSessionPhoto, albumZip, deleteAlbumPhotos, getAdminAlbum, getPublicAlbum, listRecentAlbums, restoreAlbumPhotos, setAlbumCover,
} from './session-photo.service.ts'
import { writeZip } from './zip-writer.ts'
import type { FileStores } from '../../storage/file-store.ts'
import { readImageBody } from '../../storage/staged-upload.ts'

export function createAdminPhotoController(database: PrismaClient, files: FileStores) {
  const album: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await getAdminAlbum(database, request.params.id))
  }
  const upload: RequestHandler<{ id: string }> = async (request, response) => {
    const adminId = (response.locals.admin as { id: string } | undefined)?.id ?? null
    response.status(201).json(await addSessionPhoto(database, files.publicFiles, request.params.id, await readImageBody(request, files.privateFiles, 'photo'), adminId))
  }
  const cover: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await setAlbumCover(database, request.params.id, request.body))
  }
  const remove: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await deleteAlbumPhotos(database, files.publicFiles, request.params.id, request.body))
  }
  const restore: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await restoreAlbumPhotos(database, request.params.id, request.body))
  }
  return { album, upload, cover, remove, restore }
}

export function createPublicPhotoController(database: PrismaClient, files: FileStores, publicDir: string) {
  const album: RequestHandler<{ id: string }> = async (request, response) => {
    response.set('Cache-Control', 'no-store').json(await getPublicAlbum(database, request.params.id))
  }
  const recent: RequestHandler = async (request, response) => {
    const limit = Number(request.query.limit ?? 12)
    response.set('Cache-Control', 'no-store').json(await listRecentAlbums(database, Number.isInteger(limit) ? limit : 12))
  }
  const zip: RequestHandler<{ id: string }> = async (request, response) => {
    const { fileName, entries } = await albumZip(database, files.publicFiles, publicDir, request.params.id)
    response.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${fileName.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'no-store',
    })
    await writeZip(response, entries)
    response.end()
  }
  return { album, recent, zip }
}
