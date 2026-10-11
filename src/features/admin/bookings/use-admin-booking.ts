import { useEffect, useState } from 'react'
import type { AdminResult } from '@/lib/admin-api'
import type { AdminBookingDetailResponse } from '@shared/api/admin-bookings'
import { useAdminAuth } from '../auth/use-admin-auth'

// One booking's detail, for the phone screen and the desktop drawer. `replace` swaps in a detail the server sent
// back (after linking a customer) without fetching again. `held` is what the drawer shows: this booking, or while it
// loads (and while the drawer closes) the last booking that loaded, with `stale` set so the drawer keeps it inert.
export function useAdminBooking(id: string | null) {
  const { get, state: auth } = useAdminAuth()
  const [result, setResult] = useState<{ id: string; response: AdminResult<AdminBookingDetailResponse> } | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!id || auth.status !== 'signedIn') return
    const controller = new AbortController()
    void get<AdminBookingDetailResponse>(`/api/admin/bookings/${encodeURIComponent(id)}`, controller.signal).then(response => {
      if (!controller.signal.aborted) setResult({ id, response })
    })
    return () => controller.abort()
  }, [get, id, attempt, auth.status])
  const response = id && result?.id === id ? result.response : null
  const held = response ?? (result?.response.kind === 'ok' ? result.response : null)
  return {
    response,
    held,
    stale: held !== null && held !== response,
    retry: () => { setResult(null); setAttempt(value => value + 1) },
    replace: (detail: AdminBookingDetailResponse) => { if (id) setResult({ id, response: { kind: 'ok', data: detail } }) },
  }
}
