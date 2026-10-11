import { useEffect, useState } from 'react'
import type { AdminResult } from '@/lib/admin-api'
import type { AdminBookingDetailResponse } from '@shared/api/admin-bookings'
import { useAdminAuth } from '../auth/use-admin-auth'

// One booking's detail, for the phone screen and the desktop drawer. `replace` swaps in a detail the server sent
// back (after linking a customer) without fetching again.
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
  return {
    response,
    retry: () => { setResult(null); setAttempt(value => value + 1) },
    replace: (detail: AdminBookingDetailResponse) => { if (id) setResult({ id, response: { kind: 'ok', data: detail } }) },
  }
}
