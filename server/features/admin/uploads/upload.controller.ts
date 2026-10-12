import type { RequestHandler } from 'express'
import { issueUploadTicket, readUploadPurpose } from '../../../storage/staged-upload.ts'

export function createAdminUploadController() {
  const ticket: RequestHandler = async (request, response) => {
    response.json(await issueUploadTicket(readUploadPurpose(request.body, ['photo', 'coach'])))
  }
  return { ticket }
}
