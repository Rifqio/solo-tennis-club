import { Readable } from 'node:stream'
import type { Request, RequestHandler } from 'express'
import type { PrismaClient } from '../../generated/prisma/client.ts'
import { parseCookies } from '../../auth/cookie.ts'
import { ApiError } from '../../http/errors.ts'
import { PROOF_FILE_MAX_BYTES, PROOF_FILES_MAX } from '../../../shared/api/customer-payments.ts'
import { isOpaqueToken, requireCustomerSession, requireMatchingCsrf } from '../customer/auth/customer-session.service.ts'
import { CUSTOMER_COOKIE } from '../customer/auth/customer-cookie.ts'
import { getPayment, submitProof } from './customer-payment.service.ts'
import type { IncomingFile } from './customer-payment.service.ts'
import type { FileStores } from '../../storage/file-store.ts'
import { issueUploadTicket, takeIncoming } from '../../storage/staged-upload.ts'

// The whole multipart body: three files at the limit plus room for the form's own lines.
const MAX_BODY_BYTES = PROOF_FILES_MAX * PROOF_FILE_MAX_BYTES + 64 * 1024

function customerToken(request: Request) {
  const token = parseCookies(request.headers.cookie)[CUSTOMER_COOKIE] ?? ''
  return isOpaqueToken(token) ? token : ''
}

// Reads a multipart/form-data body with the platform's own parser. The declared length is checked before anything is
// read, so an oversized upload is refused without buffering it.
async function readProofForm(request: Request, stores: FileStores): Promise<{ submissionId: string; files: IncomingFile[] }> {
  if (request.is('application/json')) return readStagedProof(request, stores)
  if (!request.is('multipart/form-data')) throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE')
  const length = Number(request.get('content-length'))
  if (!Number.isFinite(length) || length <= 0) throw new ApiError(400, 'VALIDATION_FAILED', { files: 'REQUIRED' })
  if (length > MAX_BODY_BYTES) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', { files: 'TOO_LONG' })
  let form: FormData
  try {
    form = await new globalThis.Request('http://local' + request.originalUrl, {
      method: 'POST', headers: { 'content-type': request.get('content-type')! },
      body: Readable.toWeb(request) as ReadableStream, duplex: 'half',
    } as RequestInit).formData()
  } catch {
    throw new ApiError(400, 'VALIDATION_FAILED', { files: 'INVALID_FORMAT' })
  }
  const submissionId = form.get('submissionId')
  const files = await Promise.all(form.getAll('files').filter((value): value is File => value instanceof File)
    .map(async file => ({ bytes: Buffer.from(await file.arrayBuffer()), name: file.name })))
  return { submissionId: typeof submissionId === 'string' ? submissionId : '', files }
}

// After direct uploads (hosted demo): { submissionId, files: [{ key, name }] } naming files already in Blob.
async function readStagedProof(request: Request, stores: FileStores): Promise<{ submissionId: string; files: IncomingFile[] }> {
  const body = request.body as { submissionId?: unknown; files?: unknown } | null
  const listed = Array.isArray(body?.files) ? body.files as Array<{ key?: unknown; name?: unknown } | null> : []
  if (listed.length > PROOF_FILES_MAX) throw new ApiError(400, 'VALIDATION_FAILED', { files: 'TOO_LONG' })
  const files: IncomingFile[] = []
  for (const [index, item] of listed.entries()) {
    const bytes = await takeIncoming(stores.privateFiles, 'proof', item?.key, `file${index}`)
    files.push({ bytes, name: typeof item?.name === 'string' ? item.name.slice(0, 200) : '' })
  }
  return { submissionId: typeof body?.submissionId === 'string' ? body.submissionId : '', files }
}

export function createCustomerPaymentController(database: PrismaClient, files: FileStores, clock = () => new Date()) {
  const payment: RequestHandler<{ id: string }> = async (request, response) => {
    const now = clock()
    const session = await requireCustomerSession(database, customerToken(request), now)
    response.json(await getPayment(database, session.customer.id, request.params.id, now))
  }
  const submit: RequestHandler<{ id: string }> = async (request, response) => {
    const session = await requireCustomerSession(database, customerToken(request), clock())
    requireMatchingCsrf(request.get('x-csrf-token') ?? '', session.csrfToken)
    const form = await readProofForm(request, files)
    const result = await submitProof(database, files.privateFiles, session.customer.id, request.params.id, form, clock)
    response.status(result.replayed ? 200 : 201).json(result)
  }
  // A ticket for one direct proof upload (hosted demo); only a signed-in member may ask.
  const uploadTicket: RequestHandler = async (request, response) => {
    const session = await requireCustomerSession(database, customerToken(request), clock())
    requireMatchingCsrf(request.get('x-csrf-token') ?? '', session.csrfToken)
    response.json(await issueUploadTicket('proof'))
  }
  return { payment, submit, uploadTicket }
}
