import { useEffect, useState } from 'react'
import { getJson } from '@/lib/api'
import type { PublicUpcomingResponse } from '@shared/api/public'

type UpcomingState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: PublicUpcomingResponse }

// Fetched each time the book sheet opens, so places left are current; nothing is requested while it is closed.
export function useUpcoming(open: boolean) {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<{ key: number; state: UpcomingState } | null>(null)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    void getJson<PublicUpcomingResponse>('/api/public/upcoming', { signal: controller.signal }).then(result => {
      if (controller.signal.aborted || result.kind === 'aborted') return
      setSettled({ key: attempt, state: result.kind === 'ok' ? { status: 'ready', data: result.data } : { status: 'error' } })
    })
    return () => { controller.abort(); setSettled(null) }
  }, [open, attempt])

  const state: UpcomingState = settled?.key === attempt ? settled.state : { status: 'loading' }
  return { ...state, retry: () => setAttempt(value => value + 1) }
}
