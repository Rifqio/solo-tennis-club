import type { RequestHandler } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { removeCoachPhoto, saveCoachPhoto } from './coach-photo.service.ts'

export function createCoachPhotoController(database: PrismaClient, uploadsDir: string) {
  const upload: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await saveCoachPhoto(database, request.params.id, request.body as Buffer | undefined, uploadsDir))
  }
  const remove: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await removeCoachPhoto(database, request.params.id, uploadsDir))
  }
  return { upload, remove }
}
