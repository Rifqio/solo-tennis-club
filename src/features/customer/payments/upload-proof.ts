import type { ApiErrorBody } from '@shared/api/errors'
import type { ProofSubmissionResponse } from '@shared/api/customer-payments'
import { putDirect, requestUploadTicket, sendJson, sendWithProgress, type DirectTicket, type SendResult } from '@/lib/direct-upload'

export type UploadOutcome =
  | { kind: 'ok'; data: ProofSubmissionResponse }
  | { kind: 'http'; status: number; error: ApiErrorBody['error'] }
  | { kind: 'network' }
  | { kind: 'aborted' }

// Sends the proof with a visible percentage, because a 15 MB upload on a phone needs one. Locally the files go as
// multipart/form-data; on the hosted demo each goes straight into Blob first and the API is sent their keys. The same
// submissionId is reused on a retry, so a reply lost on the way back can never create a second proof.
export async function uploadProof(bookingId: string, input: { submissionId: string; files: File[]; csrfToken: string },
  onProgress: (percent: number) => void, signal?: AbortSignal): Promise<UploadOutcome> {
  const path = `/api/customer/bookings/${encodeURIComponent(bookingId)}/proofs`
  const report = (fraction: number) => onProgress(Math.min(99, Math.round(fraction * 100)))
  const first = await requestUploadTicket('/api/customer/uploads', 'proof', input.csrfToken, signal)
  let sent: SendResult
  if (first.kind === 'failed') sent = { status: first.status, body: '' }
  else if (first.kind === 'inline') {
    const form = new FormData()
    form.set('submissionId', input.submissionId)
    for (const file of input.files) form.append('files', file, file.name)
    sent = await sendWithProgress('POST', path, form, { 'X-CSRF-Token': input.csrfToken, Accept: 'application/json' }, report, signal)
  } else sent = await sendDirect(path, input, first.ticket, report, signal)
  return toOutcome(sent, onProgress, signal)
}

async function sendDirect(path: string, input: { submissionId: string; files: File[]; csrfToken: string },
  firstTicket: DirectTicket,
  report: (fraction: number) => void, signal?: AbortSignal): Promise<SendResult> {
  const total = input.files.reduce((sum, file) => sum + file.size, 0) || 1
  let done = 0
  const files: { key: string; name: string }[] = []
  for (const [index, file] of input.files.entries()) {
    let ticket = firstTicket
    if (index > 0) {
      const next = await requestUploadTicket('/api/customer/uploads', 'proof', input.csrfToken, signal)
      if (next.kind !== 'direct') return { status: next.kind === 'failed' ? next.status : 0, body: '' }
      ticket = next.ticket
    }
    try { await putDirect(ticket, file, fraction => report((done + fraction * file.size) / total), signal) } catch { return { status: 0, body: '' } }
    done += file.size
    files.push({ key: ticket.key, name: file.name })
  }
  return sendJson('POST', path, { submissionId: input.submissionId, files }, input.csrfToken, signal)
}

function toOutcome(sent: SendResult, onProgress: (percent: number) => void, signal?: AbortSignal): UploadOutcome {
  if (signal?.aborted) return { kind: 'aborted' }
  if (sent.status === 0) return { kind: 'network' }
  let body: unknown = null
  try { body = JSON.parse(sent.body) } catch { /* A proxy may answer with HTML. */ }
  if (sent.status >= 200 && sent.status < 300 && body) { onProgress(100); return { kind: 'ok', data: body as ProofSubmissionResponse } }
  return { kind: 'http', status: sent.status, error: (body as ApiErrorBody | null)?.error ?? { code: 'INTERNAL' } }
}
