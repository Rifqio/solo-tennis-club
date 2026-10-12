import { putDirect, requestUploadTicket, sendJson, sendWithProgress, type SendResult } from '@/lib/direct-upload'

// One album photo: straight into Blob and then named to the API on the hosted demo, or as the request body locally.
export async function uploadAlbumPhoto(sessionId: string, photo: Blob, csrfToken: string | undefined,
  onProgress: (fraction: number) => void, signal: AbortSignal): Promise<SendResult> {
  const path = `/api/admin/sessions/${encodeURIComponent(sessionId)}/photos`
  const ticket = await requestUploadTicket('/api/admin/uploads', 'photo', csrfToken, signal)
  if (ticket.kind === 'failed') return { status: ticket.status, body: '' }
  if (ticket.kind === 'direct') {
    try { await putDirect(ticket.ticket, photo, onProgress, signal) } catch { return { status: 0, body: '' } }
    return sendJson('POST', path, { key: ticket.ticket.key }, csrfToken, signal)
  }
  const headers: Record<string, string> = { 'Content-Type': photo.type || 'image/jpeg', Accept: 'application/json' }
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  return sendWithProgress('POST', path, photo, headers, onProgress, signal)
}
