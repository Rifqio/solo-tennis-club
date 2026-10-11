import { useEffect, useState } from 'react'
import type { AdminResult } from '@/lib/admin-api'
import type { AdminBookingFilter, AdminBookingListResponse, AdminBookingSummary } from '@shared/api/admin-bookings'
import { useAdminAuth } from '../auth/use-admin-auth'

// The last good first page per filter and search, so the list reopened (after opening a booking, which is another
// route) shows at once and refreshes behind it.
const lastPages = new Map<string, AdminBookingListResponse>()

// Incoming bookings for one filter and search, a page at a time. The rows on screen stay while a new search loads.
// `refresh`: any value that changes when the list should be fetched again (the navigation key).
export function useAdminBookingList(filter: AdminBookingFilter, search = '', refresh?: unknown) {
  const { get, state: auth } = useAdminAuth()
  const key = `/api/admin/bookings?status=${filter}${search.trim() ? `&q=${encodeURIComponent(search.trim())}` : ''}`
  const [result, setResult] = useState<{ key: string; response: AdminResult<AdminBookingListResponse> } | null>(null)
  const [shown, setShown] = useState<AdminBookingListResponse | null>(() => lastPages.get(key) ?? null)
  const [more, setMore] = useState<{ key: string; items: AdminBookingSummary[]; nextCursor: string | null } | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (auth.status !== 'signedIn') return
    const controller = new AbortController()
    void get<AdminBookingListResponse>(key, controller.signal).then(response => {
      if (controller.signal.aborted) return
      if (response.kind === 'ok') lastPages.set(key, response.data)
      setResult({ key, response }); setMore(null)
    })
    return () => controller.abort()
  }, [get, key, attempt, auth.status, refresh])
  const response = result?.key === key ? result.response : null
  const fresh = response?.kind === 'ok' ? response.data : null
  // Adjusting state during render (React's documented pattern) keeps the last rows until the next ones arrive.
  if (fresh && shown !== fresh) setShown(fresh)
  const data = fresh ?? (response ? null : shown)
  const extra = more?.key === key ? more : null
  const nextCursor = extra ? extra.nextCursor : fresh?.nextCursor ?? null
  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await get<AdminBookingListResponse>(`${key}&cursor=${encodeURIComponent(nextCursor)}`)
      if (page.kind === 'ok') setMore({ key, items: [...(extra?.items ?? []), ...page.data.items], nextCursor: page.data.nextCursor })
    } finally { setLoadingMore(false) }
  }
  return {
    status: data ? 'ready' as const : response ? 'error' as const : 'loading' as const,
    searching: !fresh && !response && Boolean(shown),
    data,
    items: [...(data?.items ?? []), ...(extra?.items ?? [])],
    hasMore: Boolean(nextCursor), loadMore, loadingMore,
    retry: () => { setResult(null); setAttempt(value => value + 1) },
  }
}
