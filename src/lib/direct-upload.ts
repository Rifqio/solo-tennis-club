import type { UploadPurpose, UploadTicketResponse } from '@shared/api/uploads'

// Uploads on the hosted demo go from the browser straight into Vercel Blob (a Vercel Function takes at most 4.5 MB
// per request), and the API is then sent the file's key instead of the file. Locally the first ticket says direct
// uploads are off; that answer is remembered, so later files go in the request without asking again.
export type DirectTicket = Extract<UploadTicketResponse, { direct: true }>
export type TicketResult = { kind: 'direct'; ticket: DirectTicket } | { kind: 'inline' } | { kind: 'failed'; status: number }
export interface SendResult { status: number; body: string }

let directOff = false

export async function requestUploadTicket(path: '/api/admin/uploads' | '/api/customer/uploads', purpose: UploadPurpose,
  csrfToken: string | undefined, signal?: AbortSignal): Promise<TicketResult> {
  if (directOff) return { kind: 'inline' }
  const sent = await sendJson('POST', path, { purpose }, csrfToken, signal)
  if (sent.status !== 200) return { kind: 'failed', status: sent.status }
  const ticket = JSON.parse(sent.body) as UploadTicketResponse
  if (!ticket.direct) { directOff = true; return { kind: 'inline' } }
  return { kind: 'direct', ticket }
}

// Puts one file into Blob under the ticket's key. The Blob client loads only when a direct upload happens.
export async function putDirect(ticket: DirectTicket, file: Blob, onProgress: (fraction: number) => void, signal?: AbortSignal) {
  const { put } = await import('@vercel/blob/client')
  await put(ticket.key, file, {
    access: ticket.access, token: ticket.token, contentType: file.type || undefined, abortSignal: signal,
    onUploadProgress: event => onProgress(Math.min(1, event.percentage / 100)),
  })
}

export async function sendJson(method: 'POST' | 'PUT', path: string, body: unknown, csrfToken: string | undefined, signal?: AbortSignal): Promise<SendResult> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken
    const response = await fetch(path, { method, credentials: 'same-origin', cache: 'no-store', headers, body: JSON.stringify(body), signal })
    return { status: response.status, body: await response.text() }
  } catch {
    return { status: 0, body: '' }
  }
}

// XMLHttpRequest rather than fetch, because only it reports upload progress. An aborted request answers status 0.
export function sendWithProgress(method: 'POST' | 'PUT', path: string, body: Blob | FormData, headers: Record<string, string>,
  onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<SendResult> {
  return new Promise(resolve => {
    const request = new XMLHttpRequest()
    request.open(method, path)
    request.withCredentials = true
    for (const [name, value] of Object.entries(headers)) request.setRequestHeader(name, value)
    request.upload.onprogress = event => { if (event.lengthComputable) onProgress(event.loaded / event.total) }
    request.onload = () => resolve({ status: request.status, body: request.responseText })
    request.onerror = () => resolve({ status: 0, body: '' })
    request.ontimeout = () => resolve({ status: 0, body: '' })
    request.onabort = () => resolve({ status: 0, body: '' })
    signal?.addEventListener('abort', () => request.abort(), { once: true })
    request.send(body)
  })
}
