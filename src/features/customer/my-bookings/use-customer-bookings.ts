import { useEffect, useState } from 'react'
import type { CustomerBookingDetailResponse, CustomerBookingItem, CustomerBookingListResponse, CustomerBookingView } from '@shared/api/customer-bookings'
import { CustomerApiError, customerRequest } from '@/lib/customer-api'

export type Loaded<T> = { status: 'loading' } | { status: 'signedOut' } | { status: 'error' } | { status: 'missing' } | ({ status: 'ready'; receivedAt: number } & T)

function failureOf(error: unknown): Loaded<never> {
  if (error instanceof CustomerApiError && error.status === 401) return { status: 'signedOut' }
  if (error instanceof CustomerApiError && error.status === 404) return { status: 'missing' }
  return { status: 'error' }
}

// One view of the customer's bookings. History pages on with loadMore; upcoming comes in one piece. `held`: while a
// newly chosen view loads, the last view that loaded, so the screen keeps it instead of blanking.
export function useCustomerBookings(view: CustomerBookingView) {
  const [state, setState] = useState<{ view: CustomerBookingView; loaded: Loaded<{ items: CustomerBookingItem[]; nextCursor: string | null; serverNow: string }> } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    customerRequest<CustomerBookingListResponse>(`/api/customer/bookings?view=${view}`, { signal: controller.signal })
      .then(data => setState({ view, loaded: { status: 'ready', receivedAt: Date.now(), items: data.items, nextCursor: data.nextCursor, serverNow: data.serverNow } }))
      .catch(error => { if (!controller.signal.aborted) setState({ view, loaded: failureOf(error) }) })
    return () => controller.abort()
  }, [view, attempt])
  const loaded = state?.view === view ? state.loaded : { status: 'loading' as const }
  const loadMore = async () => {
    if (loaded.status !== 'ready' || !loaded.nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await customerRequest<CustomerBookingListResponse>(`/api/customer/bookings?view=${view}&cursor=${encodeURIComponent(loaded.nextCursor)}`)
      setState({ view, loaded: { ...loaded, items: [...loaded.items, ...data.items], nextCursor: data.nextCursor } })
    } catch (error) { setState({ view, loaded: failureOf(error) }) } finally { setLoadingMore(false) }
  }
  const held = loaded.status === 'loading' && state?.loaded.status === 'ready' ? state : null
  return { loaded, held, loadMore, loadingMore, retry: () => { setState(null); setAttempt(value => value + 1) } }
}

export function useCustomerBooking(id: string) {
  const [state, setState] = useState<{ id: string; loaded: Loaded<CustomerBookingDetailResponse> } | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    customerRequest<CustomerBookingDetailResponse>(`/api/customer/bookings/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(data => setState({ id, loaded: { status: 'ready', receivedAt: Date.now(), ...data } }))
      .catch(error => { if (!controller.signal.aborted) setState({ id, loaded: failureOf(error) }) })
    return () => controller.abort()
  }, [id, attempt])
  // `previous`: the last answer for another id, for screens that keep it visible while the next one loads.
  return { loaded: state?.id === id ? state.loaded : { status: 'loading' as const }, previous: state?.id === id ? null : state?.loaded ?? null, retry: () => { setState(null); setAttempt(value => value + 1) } }
}

// Server time now, from the serverNow the response carried and the local clock since it arrived.
export function serverClock(serverNow: string, receivedAt: number, localNow: number) {
  return Date.parse(serverNow) + (localNow - receivedAt)
}
