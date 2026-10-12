import { useEffect, useState } from 'react'
import { getJson } from '@/lib/api'
import type { ApiResult } from '@/lib/api'
import type { PublicAlbumResponse, RecentAlbumsResponse } from '@shared/api/session-photos'

function usePublicJson<T>(path: string | null) {
  const [result, setResult] = useState<{ path: string; response: ApiResult<T> } | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    void getJson<T>(path, { signal: controller.signal }).then(response => {
      if (response.kind !== 'aborted') setResult({ path, response })
    })
    return () => controller.abort()
  }, [path, attempt])
  return { result: result?.path === path ? result.response : null, retry: () => { setResult(null); setAttempt(value => value + 1) } }
}

export function useRecentAlbums(limit: number) {
  return usePublicJson<RecentAlbumsResponse>(`/api/public/albums?limit=${limit}`)
}

export function usePublicAlbum(sessionId: string) {
  return usePublicJson<PublicAlbumResponse>(sessionId ? `/api/public/sessions/${encodeURIComponent(sessionId)}/photos` : null)
}
