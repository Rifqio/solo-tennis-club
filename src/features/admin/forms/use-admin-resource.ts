import { useEffect, useState } from 'react'
import { useAdminAuth } from '../auth/use-admin-auth'
import type { AdminResult } from '@/lib/admin-api'

// The last good answer per path. Screens that open the same data again (a desktop list beside its editor, a list
// after a save) show it at once and refresh behind it, so the page never blanks into a loading state between clicks.
const lastGood = new Map<string, unknown>()

// `refresh`: any value that changes when the data should be fetched again (for example the navigation key after a save).
export function useAdminResource<T>(path: string | null, refresh?: unknown) {
  const { get, state } = useAdminAuth()
  const [result, setResult] = useState<{ path: string; response: AdminResult<T> } | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!path || state.status !== 'signedIn') return
    const controller = new AbortController()
    void get<T>(path, controller.signal).then(response => {
      if (controller.signal.aborted) return
      if (response.kind === 'ok') lastGood.set(path, response.data)
      setResult({ path, response })
    })
    return () => controller.abort()
  }, [path, get, state.status, attempt, refresh])
  const cached = path && lastGood.has(path) ? { kind: 'ok', data: lastGood.get(path) as T } as AdminResult<T> : null
  const response = result?.path === path ? result.response : cached
  return { response, data: response?.kind === 'ok' ? response.data : null, retry: () => { setResult(null); setAttempt(value => value + 1) } }
}
