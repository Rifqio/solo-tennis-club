import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AdminSessionInfo } from '@shared/api/admin-auth'
import { adminGet, adminSend } from '@/lib/admin-api'
import { AdminAuthContext } from './admin-auth-context'
import type { AdminAuthState } from './admin-auth-context'

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({ status: 'loading' })
  const [identity, setIdentity] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const stateRef = useRef(state)
  const generation = useRef(0)
  useEffect(() => { stateRef.current = state }, [state])

  const expire = useCallback(() => {
    const next: AdminAuthState = { status: stateRef.current.status === 'signedIn' || stateRef.current.status === 'expired' ? 'expired' : 'signedOut' }
    stateRef.current = next
    setState(next)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    const currentGeneration = generation.current
    void adminGet<AdminSessionInfo>('/api/admin/auth/session', { signal: controller.signal }).then(result => {
      if (controller.signal.aborted || currentGeneration !== generation.current) return
      const next: AdminAuthState = result.kind === 'ok' ? { status: 'signedIn', info: result.data }
        : result.kind === 'http' && result.status === 401 ? { status: 'signedOut' } : { status: 'error' }
      stateRef.current = next
      if (next.status === 'signedIn') setIdentity(next.info.admin.email)
      setState(next)
    })
    return () => controller.abort()
  }, [attempt])

  const value = useMemo(() => ({
    state,
    identity,
    reload: () => { setState({ status: 'loading' }); setAttempt(value => value + 1) },
    signIn: async (email: string, password: string) => {
      generation.current += 1
      // Development builds only: empty email and password use the server's development sign-in (testing shortcut).
      const development = import.meta.env.DEV && !email && !password
      const result = await adminSend<AdminSessionInfo>('POST', development ? '/api/admin/auth/dev-sign-in' : '/api/admin/auth/sign-in', development ? {} : { email, password })
      if (result.kind === 'ok') {
        if (identity !== null && identity !== result.data.admin.email) { try { sessionStorage.removeItem('lafu.sessionDraft') } catch { /* Storage is optional. */ } }
        setIdentity(result.data.admin.email)
        const next: AdminAuthState = { status: 'signedIn', info: result.data }
        stateRef.current = next
        setState(next)
      } else if (stateRef.current.status === 'loading') {
        const next: AdminAuthState = { status: 'signedOut' }
        stateRef.current = next
        setState(next)
      }
      return result
    },
    signOut: async () => {
      generation.current += 1
      const current = stateRef.current
      const result = await adminSend<void>('POST', '/api/admin/auth/sign-out', {}, {
        csrfToken: current.status === 'signedIn' ? current.info.csrfToken : undefined,
      })
      if (result.kind === 'ok' || (result.kind === 'http' && result.status === 401)) {
        setIdentity(null)
        try { sessionStorage.removeItem('lafu.sessionDraft') } catch { /* Storage can be unavailable in private browsing. */ }
        const next: AdminAuthState = { status: 'signedOut' }
        stateRef.current = next
        setState(next)
      }
      return result
    },
    get: <T,>(path: string, signal?: AbortSignal) => {
      const currentGeneration = generation.current
      return adminGet<T>(path, { signal, onUnauthenticated: () => {
        if (currentGeneration === generation.current) expire()
      } })
    },
    send: <T,>(method: 'POST' | 'PUT', path: string, body: unknown) => {
      const current = stateRef.current
      const currentGeneration = generation.current
      return adminSend<T>(method, path, body, { csrfToken: current.status === 'signedIn' ? current.info.csrfToken : undefined,
        onUnauthenticated: () => { if (currentGeneration === generation.current) expire() } })
    },
  }), [state, identity, expire])
  return <AdminAuthContext value={value}>{children}</AdminAuthContext>
}
