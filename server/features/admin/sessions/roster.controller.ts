import type { RequestHandler } from 'express'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { getAdminRoster } from './roster.service.ts'

export function createRosterController(database: PrismaClient) {
  const detail: RequestHandler<{ id: string }> = async (request, response) => {
    response.json(await getAdminRoster(database, request.params.id))
  }
  return { detail }
}
