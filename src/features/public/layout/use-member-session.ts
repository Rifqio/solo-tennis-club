import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { CustomerSessionResponse } from '@shared/api/customer-auth'
import { customerRequest } from '@/lib/customer-api'

// Who is signed in, for the navigation: the Akun initials and the rail's Keluar. Read again on every screen change,
// since signing in or out happens on screens of their own. Null while unknown or signed out.
export function useMemberSession() {
  const { pathname } = useLocation()
  const [session, setSession] = useState<CustomerSessionResponse | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    customerRequest<CustomerSessionResponse>('/api/customer/auth/session', { signal: controller.signal })
      .then(setSession)
      .catch(() => { if (!controller.signal.aborted) setSession(null) })
    return () => controller.abort()
  }, [pathname])
  return { session, clear: () => setSession(null) }
}

export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase()
}
