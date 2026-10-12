import { useCallback, useEffect, useRef, useState } from 'react'
import { useOnline } from '@/lib/use-online'
import type { AdminSessionPhoto } from '@shared/api/session-photos'
import { shrinkPhoto } from './shrink-photo'
import { uploadAlbumPhoto } from './upload-album-photo'

export type UploadStatus = 'preparing' | 'waiting' | 'uploading' | 'failed'

export interface UploadItem {
  key: string
  preview: string
  width: number
  height: number
  status: UploadStatus
  progress: number
  blob?: Blob
}

export type SkipReason = 'not-photo' | 'too-big' | 'unreadable'

const PARALLEL = 2

// The album's upload queue (board 18): each picked photo becomes a tile at once, is shrunk in the browser, then goes
// up on its own request, two at a time, with its own progress. A failed photo waits for Ulangi. Offline, the queue
// waits and carries on by itself once the browser is back online. Leaving the screen cancels what is still going.
export function useAlbumUploads({ sessionId, csrfToken, onUploaded, onBatchDone, onSignedOut }: {
  sessionId: string
  csrfToken: string | undefined
  onUploaded: (photo: AdminSessionPhoto) => void
  onBatchDone: (count: number) => void
  onSignedOut: () => void
}) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [skipped, setSkipped] = useState<Record<SkipReason, number> | null>(null)
  const online = useOnline()
  const requests = useRef(new Map<string, AbortController>())
  const batch = useRef(0)
  const nextKey = useRef(0)
  const callbacks = useRef({ onUploaded, onBatchDone, onSignedOut })
  useEffect(() => { callbacks.current = { onUploaded, onBatchDone, onSignedOut } })

  const patch = useCallback((key: string, change: Partial<UploadItem>) => {
    setItems(list => list.map(item => item.key === key ? { ...item, ...change } : item))
  }, [])

  const add = useCallback(async (files: File[]) => {
    const added = files.map(file => ({ file, key: `u${nextKey.current++}`, preview: URL.createObjectURL(file) }))
    setItems(list => [...list, ...added.map(({ key, preview }): UploadItem => ({ key, preview, width: 4, height: 3, status: 'preparing', progress: 0 }))])
    const counts: Record<SkipReason, number> = { 'not-photo': 0, 'too-big': 0, unreadable: 0 }
    for (const { file, key, preview } of added) {
      const result = await shrinkPhoto(file)
      if (result.kind === 'skip') {
        counts[result.reason]++
        URL.revokeObjectURL(preview)
        setItems(list => list.filter(item => item.key !== key))
        continue
      }
      URL.revokeObjectURL(preview)
      patch(key, { blob: result.blob, preview: URL.createObjectURL(result.blob), width: result.width, height: result.height, status: 'waiting' })
    }
    if (counts['not-photo'] + counts['too-big'] + counts.unreadable > 0) setSkipped(counts)
  }, [patch])

  const send = useCallback((item: UploadItem) => {
    if (!item.blob) return
    const controller = new AbortController()
    requests.current.set(item.key, controller)
    patch(item.key, { status: 'uploading', progress: 0 })
    void uploadAlbumPhoto(sessionId, item.blob, csrfToken, progress => patch(item.key, { progress }), controller.signal).then(({ status, body }) => {
      requests.current.delete(item.key)
      if (controller.signal.aborted) return
      if (status === 201) {
        URL.revokeObjectURL(item.preview)
        setItems(list => list.filter(entry => entry.key !== item.key))
        batch.current++
        callbacks.current.onUploaded(JSON.parse(body) as AdminSessionPhoto)
        return
      }
      if (status === 401) callbacks.current.onSignedOut()
      // A dropped connection goes back in the queue; anything the server refused waits for Ulangi.
      patch(item.key, status === 0 && !navigator.onLine ? { status: 'waiting', progress: 0 } : { status: 'failed', progress: 0 })
    })
  }, [sessionId, csrfToken, patch])

  // Starts the next waiting photos while there is room and a connection.
  useEffect(() => {
    if (!online) return
    const going = items.filter(item => item.status === 'uploading').length
    items.filter(item => item.status === 'waiting').slice(0, Math.max(0, PARALLEL - going)).forEach(send)
  }, [items, online, send])

  // When the last photo of a batch lands, one toast counts them.
  const busy = items.some(item => item.status !== 'failed')
  useEffect(() => {
    if (busy || batch.current === 0) return
    callbacks.current.onBatchDone(batch.current)
    batch.current = 0
  }, [busy])

  useEffect(() => () => {
    for (const request of requests.current.values()) request.abort()
  }, [])

  const retry = useCallback((keys: string[]) => {
    setItems(list => list.map(item => keys.includes(item.key) && item.status === 'failed' ? { ...item, status: 'waiting' } : item))
  }, [])

  // Leaving with photos still going: stop them and forget them.
  const cancelAll = useCallback(() => {
    for (const request of requests.current.values()) request.abort()
    requests.current.clear()
    setItems(list => { list.forEach(item => URL.revokeObjectURL(item.preview)); return [] })
  }, [])

  return { items, add, retry, cancelAll, online, skipped, clearSkipped: () => setSkipped(null), pending: items.filter(item => item.status !== 'failed').length }
}
