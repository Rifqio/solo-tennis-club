import type { ApiErrorBody } from '@shared/api/errors'
import type { ProofSubmissionResponse } from '@shared/api/customer-payments'

export type UploadOutcome =
  | { kind: 'ok'; data: ProofSubmissionResponse }
  | { kind: 'http'; status: number; error: ApiErrorBody['error'] }
  | { kind: 'network' }
  | { kind: 'aborted' }

// Sends the proof as multipart/form-data. XMLHttpRequest rather than fetch, because only it reports upload progress,
// and a 15 MB upload on a phone needs a visible percentage. The same submissionId is reused on a retry, so a reply lost
// on the way back can never create a second proof.
export function uploadProof(bookingId: string, input: { submissionId: string; files: File[]; csrfToken: string },
  onProgress: (percent: number) => void, signal?: AbortSignal): Promise<UploadOutcome> {
  return new Promise(resolve => {
    const form = new FormData()
    form.set('submissionId', input.submissionId)
    for (const file of input.files) form.append('files', file, file.name)
    const request = new XMLHttpRequest()
    request.open('POST', `/api/customer/bookings/${encodeURIComponent(bookingId)}/proofs`)
    request.withCredentials = true
    request.setRequestHeader('X-CSRF-Token', input.csrfToken)
    request.setRequestHeader('Accept', 'application/json')
    request.upload.onprogress = event => { if (event.lengthComputable) onProgress(Math.min(99, Math.round(event.loaded / event.total * 100))) }
    request.onload = () => {
      let body: unknown = null
      try { body = JSON.parse(request.responseText) } catch { /* A proxy may answer with HTML. */ }
      if (request.status >= 200 && request.status < 300 && body) { onProgress(100); resolve({ kind: 'ok', data: body as ProofSubmissionResponse }) }
      else resolve({ kind: 'http', status: request.status, error: (body as ApiErrorBody | null)?.error ?? { code: 'INTERNAL' } })
    }
    request.onerror = () => resolve({ kind: 'network' })
    request.ontimeout = () => resolve({ kind: 'network' })
    request.onabort = () => resolve({ kind: 'aborted' })
    signal?.addEventListener('abort', () => request.abort(), { once: true })
    request.send(form)
  })
}
