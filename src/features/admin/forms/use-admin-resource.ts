import { useEffect, useState } from 'react'
import { useAdminAuth } from '../auth/use-admin-auth'
import type { AdminResult } from '@/lib/admin-api'
export function useAdminResource<T>(path: string | null) {
  const { get, state } = useAdminAuth()
  const [result, setResult] = useState<{ path: string; response: AdminResult<T> } | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!path || state.status !== 'signedIn') return
    const controller = new AbortController()
    void get<T>(path, controller.signal).then(response => { if (!controller.signal.aborted) setResult({ path, response }) })
    return () => controller.abort()
  }, [path, get, state.status, attempt])
  const response = result?.path === path ? result.response : null
  return { response, data: response?.kind === 'ok' ? response.data : null, retry: () => { setResult(null); setAttempt(value => value + 1) } }
}
