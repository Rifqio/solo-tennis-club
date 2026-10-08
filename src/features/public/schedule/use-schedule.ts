import { useEffect, useState } from 'react'
import { getJson } from '@/lib/api'
import type { ApiResult } from '@/lib/api'
import type { PublicScheduleResponse } from '@shared/api/public'

type ScheduleState =
  | { status: 'loading' }
  | { status: 'error'; result: Exclude<ApiResult<PublicScheduleResponse>, { kind: 'ok' }> }
  | { status: 'ready'; data: PublicScheduleResponse }

// One request per (date, attempt). A newer request aborts the older one, and a response is only shown
// when its key still matches the latest request, so a previous date's rows are never labeled as current.
export function useSchedule(date: string | null) {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<{ key: string; state: ScheduleState } | null>(null)
  const key = (date ?? 'today') + '#' + attempt

  useEffect(() => {
    const controller = new AbortController()
    const path = '/api/public/schedule' + (date === null ? '' : '?date=' + encodeURIComponent(date))
    void getJson<PublicScheduleResponse>(path, { signal: controller.signal }).then(result => {
      if (controller.signal.aborted || result.kind === 'aborted') return
      setSettled({ key, state: result.kind === 'ok' ? { status: 'ready', data: result.data } : { status: 'error', result } })
    })
    return () => controller.abort()
  }, [date, key])

  const state: ScheduleState = settled?.key === key ? settled.state : { status: 'loading' }
  return { ...state, retry: () => setAttempt(value => value + 1) }
}
