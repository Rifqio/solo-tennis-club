import { useCallback, useEffect, useState } from 'react'
import type { CustomerPaymentResponse } from '@shared/api/customer-payments'
import { CustomerApiError, customerRequest } from '@/lib/customer-api'

export type PaymentLoad =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'missing' }
  | { status: 'error' }
  | { status: 'ready'; data: CustomerPaymentResponse; receivedAt: number }

// What to pay for one booking and the proof so far (GET /api/customer/bookings/:id/payment).
export function usePayment(bookingId: string) {
  const [load, setLoad] = useState<PaymentLoad>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    customerRequest<CustomerPaymentResponse>(`/api/customer/bookings/${encodeURIComponent(bookingId)}/payment`, { signal: controller.signal })
      .then(data => setLoad({ status: 'ready', data, receivedAt: Date.now() }))
      .catch(error => {
        if (controller.signal.aborted) return
        setLoad(error instanceof CustomerApiError && error.status === 401 ? { status: 'signedOut' }
          : error instanceof CustomerApiError && error.status === 404 ? { status: 'missing' } : { status: 'error' })
      })
    return () => controller.abort()
  }, [bookingId, attempt])
  const retry = useCallback(() => { setLoad({ status: 'loading' }); setAttempt(value => value + 1) }, [])
  return { load, retry }
}
