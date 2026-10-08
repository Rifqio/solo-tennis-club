import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StatusPanel } from '@/components/ui/status-panel'
import { getJson } from '@/lib/api'
import type { ApiResult } from '@/lib/api'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateLong, formatClubTime, formatIdr, formatRemainingPlaces } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import type { AvailabilityStatus } from '@shared/availability'
import type { PublicScheduleResponse } from '@shared/api/public'
import { scheduleMessages } from './schedule.messages'

// Text always carries the state; color only reinforces it (UI-SPEC availability label).
const statusClasses: Record<AvailabilityStatus, string> = {
  available: 'bg-secondary text-primary',
  nearly_full: 'bg-warning-surface text-warning',
  full: 'bg-secondary text-foreground',
  cancelled: 'bg-secondary text-foreground',
}

export function SchedulePage() {
  const { language, t } = useI18n()
  const [searchParams] = useSearchParams()
  const selectedDate = searchParams.get('date')
  const schedulePath = '/api/public/schedule' + (selectedDate === null ? '' : '?date=' + encodeURIComponent(selectedDate))
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<ApiResult<PublicScheduleResponse> | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void getJson<PublicScheduleResponse>(schedulePath, { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setResult(value)
    })
    return () => controller.abort()
  }, [attempt, schedulePath])
  const retry = () => { setResult(null); setAttempt(value => value + 1) }

  return (
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-6 py-6 lg:py-8">
      <h1 className="text-heading font-bold lg:text-display">{t(scheduleMessages.heading)}</h1>
      {result === null ? (
        <StatusPanel tone="info" title={t(scheduleMessages.loading)} />
      ) : result.kind !== 'ok' ? (
        <StatusPanel tone="error" title={t(scheduleMessages.error)} action={{ label: t(commonMessages.retry), onAction: retry }} />
      ) : (
        <section aria-labelledby="schedule-date" className="flex flex-col gap-4">
          <h2 id="schedule-date" className="text-body font-bold">{formatClubDateLong(result.data.date, language)} · WIB</h2>
          {result.data.sessions.length === 0 ? (
            <p className="text-heading font-bold">{t(scheduleMessages.emptyHeading)}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {result.data.sessions.map(session => (
                <li key={session.id} className="flex flex-col gap-2 py-4 break-words">
                  {session.isSample && <p className="text-label text-muted-foreground">{t(scheduleMessages.sampleData)}</p>}
                  <p className="text-heading font-bold tabular-nums">{formatClubTime(session.startsAt)}–{formatClubTime(session.endsAt)} <span className="text-label">WIB</span></p>
                  <h3 className="text-body font-bold">{session.className}</h3>
                  <p className="text-muted-foreground">{session.levelName} · {session.venueName}</p>
                  <p>
                    <span className="sr-only">{t(scheduleMessages.pricePerPlace)}: </span>
                    <span className="font-bold tabular-nums">{formatIdr(session.priceIdr, language)}</span>
                  </p>
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-sm px-2 py-1 text-label font-bold ${statusClasses[session.availability]}`}>{t(scheduleMessages.status[session.availability])}</span>
                    <span className="tabular-nums">{formatRemainingPlaces(session.remainingPlaces, language)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
