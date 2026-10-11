import type { Request, RequestHandler, Response } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import { parseCookies } from '../../auth/cookie.ts'
import { isOpaqueToken, requireCustomerSession } from '../customer/auth/customer-session.service.ts'
import { CUSTOMER_COOKIE } from '../customer/auth/customer-cookie.ts'
import { readAdminEvidence, readCustomerEvidence } from './evidence.service.ts'
import type { EvidenceFile } from './evidence.service.ts'

// Private files: never cached, never sniffed into another type. Images open in place; a PDF downloads.
function sendEvidence(response: Response, file: EvidenceFile) {
  const safeName = file.originalName.replace(/[^\w.-]+/g, '_').slice(0, 80) || 'bukti'
  response.set({
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Type': file.contentType,
    'Content-Disposition': `${file.contentType === 'application/pdf' ? 'attachment' : 'inline'}; filename="${safeName}"`,
  })
  response.sendFile(file.path)
}

function customerToken(request: Request) {
  const token = parseCookies(request.headers.cookie)[CUSTOMER_COOKIE] ?? ''
  return isOpaqueToken(token) ? token : ''
}

export function createEvidenceController(database: PrismaClient, privateDir: string) {
  const customerFile: RequestHandler<{ id: string; proofId: string; fileId: string }> = async (request, response) => {
    const session = await requireCustomerSession(database, customerToken(request), new Date())
    const { id: bookingId, proofId, fileId } = request.params
    sendEvidence(response, await readCustomerEvidence(database, privateDir, session.customer.id, { bookingId, proofId, fileId }))
  }
  const adminFile: RequestHandler<{ proofId: string; fileId: string }> = async (request, response) => {
    sendEvidence(response, await readAdminEvidence(database, privateDir, request.params))
  }
  return { customerFile, adminFile }
}
