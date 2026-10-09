import { useEffect, useState } from 'react'
import { CustomerApiError, customerRequest } from '@/lib/customer-api'
import type { SessionPlayersResponse } from '@shared/api/customer-players'

export type SessionPlayers =
  | { status: 'loading' }
  // Not signed in: show counts only and invite them to sign in (P2-10).
  | { status: 'signedOut' }
  // Any other failure: names are a convenience, so the schedule simply shows counts.
  | { status: 'unavailable' }
  | { status: 'ready'; sessions: Record<string, string[]> }

// Player names for one club day. The request itself tells us whether the visitor is signed in, so the schedule
// needs no separate session check.
export function useSessionPlayers(date: string | null) {
  const [settled, setSettled] = useState<{ date: string; state: SessionPlayers } | null>(null)

  useEffect(() => {
    if (date === null) return
    const controller = new AbortController()
    customerRequest<SessionPlayersResponse>(`/api/customer/session-players?date=${encodeURIComponent(date)}`, { signal: controller.signal })
      .then(data => setSettled({ date, state: { status: 'ready', sessions: data.sessions } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const signedOut = error instanceof CustomerApiError && error.status === 401
        setSettled({ date, state: { status: signedOut ? 'signedOut' : 'unavailable' } })
      })
    return () => controller.abort()
  }, [date])

  return settled !== null && settled.date === date ? settled.state : { status: 'loading' } satisfies SessionPlayers
}

// "Andy, Dmitri, +2": the first names that fit a card line, then how many more.
export function summarizePlayers(names: string[], shown = 2) {
  const head = names.slice(0, shown).join(', ')
  return names.length > shown ? `${head}, +${names.length - shown}` : head
}
