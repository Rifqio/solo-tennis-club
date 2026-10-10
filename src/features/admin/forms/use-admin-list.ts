import { useEffect, useState } from 'react'
import type { PagedList } from '@shared/api/admin-list'
import type { AdminResult } from '@/lib/admin-api'
import { useAdminAuth } from '../auth/use-admin-auth'

// The last first page per list and search, so a list reopened (desktop list beside its editor, after a save) shows at
// once and refreshes behind it instead of blanking.
const firstPages = new Map<string, PagedList<unknown>>()

type ListState<T> = { key: string; page: PagedList<T> } | { key: string; failure: AdminResult<PagedList<T>> }
type Shown<T> = { key: string; page: PagedList<T> }

// A name-sorted admin list loaded 20 at a time (PagedList): the first page for the search, then more on request.
// `refresh`: any value that changes when the list should be fetched again (for example the navigation key).
export function useAdminList<T>(path: string | null, search: string, refresh?: unknown) {
  const { get, state: auth } = useAdminAuth()
  const key = path ? `${path}${path.includes('?') ? '&' : '?'}q=${encodeURIComponent(search.trim())}` : ''
  const [state, setState] = useState<ListState<T> | null>(null)
  // The rows on screen, kept while a new search loads so the list never blanks between keystrokes.
  const [shown, setShown] = useState<Shown<T> | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  useEffect(() => {
    if (!path || auth.status !== 'signedIn') return
    const controller = new AbortController()
    void get<PagedList<T>>(key, controller.signal).then(response => {
      if (controller.signal.aborted) return
      if (response.kind === 'ok') { firstPages.set(key, response.data); setState({ key, page: response.data }) }
      else setState({ key, failure: response })
    })
    return () => controller.abort()
  }, [key, path, get, auth.status, attempt, refresh])

  const current = state?.key === key ? state : null
  const cached = key && firstPages.has(key) ? firstPages.get(key) as PagedList<T> : null
  const fresh = current && 'page' in current ? current.page : current ? null : cached
  const failure = current && 'failure' in current ? current.failure : null
  // Adjusting state during render (React's documented pattern) keeps the last results until the next ones arrive.
  if (fresh && (shown?.key !== key || shown.page !== fresh)) setShown({ key, page: fresh })
  const page = fresh ?? (failure ? null : shown?.page ?? null)
  const searching = !fresh && !failure && Boolean(shown)

  const loadMore = async () => {
    if (!page?.nextCursor || loadingMore || searching) return
    setLoadingMore(true)
    try {
      const response = await get<PagedList<T>>(`${key}&cursor=${encodeURIComponent(page.nextCursor)}`)
      if (response.kind === 'ok') setState({ key, page: { items: [...page.items, ...response.data.items], nextCursor: response.data.nextCursor, total: response.data.total } })
    } finally { setLoadingMore(false) }
  }

  return {
    status: page ? 'ready' as const : failure ? 'error' as const : 'loading' as const,
    // True while the rows on screen belong to the previous search and the new results are on their way.
    searching,
    items: page?.items ?? [], total: page?.total ?? 0, hasMore: Boolean(page?.nextCursor) && !searching,
    failure, loadMore, loadingMore,
    retry: () => { setState(null); setAttempt(value => value + 1) },
  }
}

// The search a list fetches with, settled 250ms after the last keystroke so typing does not fire a request per letter.
export function useSettledSearch(value: string) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), 250)
    return () => window.clearTimeout(timer)
  }, [value])
  return settled
}
