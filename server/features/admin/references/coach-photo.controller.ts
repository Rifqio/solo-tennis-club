import type { RequestHandler } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import type { FileStores } from '../../../storage/file-store.ts'
import { readImageBody } from '../../../storage/staged-upload.ts'
import { removeCoachPhoto, saveCoachPhoto } from './coach-photo.service.ts'

export function createCoachPhotoController(database: PrismaClient, files: FileStores) {
  const upload: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await saveCoachPhoto(database, request.params.id, await readImageBody(request, files.privateFiles, 'coach'), files.publicFiles))
  }
  const remove: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await removeCoachPhoto(database, request.params.id, files.publicFiles))
  }
  return { upload, remove }
}
