import { createContext } from 'react'
import type { AdminSessionInfo } from '@shared/api/admin-auth'
import type { AdminResult } from '@/lib/admin-api'

export type AdminAuthState =
  | { status: 'loading' | 'signedOut' | 'expired' | 'error' }
  | { status: 'signedIn'; info: AdminSessionInfo }
export interface AdminAuthValue {
  state: AdminAuthState
  identity: string | null
  reload: () => void
  signIn: (email: string, password: string) => Promise<AdminResult<AdminSessionInfo>>
  signOut: () => Promise<AdminResult<void>>
  get: <T>(path: string, signal?: AbortSignal) => Promise<AdminResult<T>>
  send: <T>(method: 'POST' | 'PUT', path: string, body: unknown) => Promise<AdminResult<T>>
}
export const AdminAuthContext = createContext<AdminAuthValue | null>(null)
