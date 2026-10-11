import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateMedium, formatClubDateShort } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/use-media-query'
import { DateStrip, TodayChip } from '@/features/public/schedule/DateStrip'
import { computeStripWindow } from '@/features/public/schedule/date-strip-window'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { publicScheduleWindow } from '@shared/schedule-window'
import { clubToday, isClubDate } from '@shared/club-time'
import type { AdminSessionDetail, AdminSessionListResponse } from '@shared/api/admin-sessions'
import type { AdminResult } from '@/lib/admin-api'
import { useAdminAuth } from '../auth/use-admin-auth'
import { AdminBand } from '../shell/AdminBand'
import { sessionsMessages as messages } from './sessions.messages'
import { RosterPanel } from './RosterPanel'

const UNPAID_FILL = 'repeating-linear-gradient(135deg, var(--color-band-tile) 0 3px, color-mix(in srgb, var(--color-band-tile) 32%, transparent) 3px 6px)'

// One continuous bar however many slots a session has: booked (striped, nobody can pay in the app yet), empty
// (grey), and a dark tick at the minimum so the admin sees at a glance whether the session will run.
function FillBar({ used, max, min, label }: { used: number; max: number; min: number; label: string }) {
  const share = (value: number) => `${Math.min(100, (value / Math.max(1, max)) * 100)}%`
  return (
    <div role="img" aria-label={label} className="relative h-2.5 rounded-full bg-surface-container-high">
      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: share(used), background: UNPAID_FILL }} />
      <span className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-on-surface" style={{ left: share(min) }} />
    </div>
  )
}

function Legend() {
  const { t } = useI18n()
  const swatch = 'size-2.5 rounded-[3px]'
  return (
    <ul aria-label={t(messages.legend)} className="flex flex-wrap gap-x-3.5 gap-y-1 text-label text-on-surface-variant">
      <li className="flex items-center gap-1.5"><span aria-hidden="true" className={swatch} style={{ background: UNPAID_FILL }} />{t(messages.legendUnpaid)}</li>
      <li className="flex items-center gap-1.5"><span aria-hidden="true" className={cn(swatch, 'bg-surface-container-high')} />{t(messages.legendEmpty)}</li>
      <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-3.5 w-0.5 rounded-full bg-on-surface" />{t(messages.legendMin)}</li>
    </ul>
  )
}

// `onSelect` (desktop, board D5): the whole card chooses the session for the roster panel beside the list, which carries
// "Ubah sesi"; a chosen card wears a blue ring. Phones (board 10) keep Peserta and Ubah on the card.
function SessionCard({ row, saved, selected = false, onSelect }: { row: AdminSessionDetail; saved: boolean; selected?: boolean; onSelect?: () => void }) {
  const { t } = useI18n()
  const cancelled = row.status !== 'scheduled'
  const used = Math.max(0, row.maxParticipants - row.remainingPlaces)
  const short = row.minParticipants - used
  const facts = [row.levelName, row.venueName, `${row.durationMinutes} mnt`].join(' · ')
  const heading = <div className="flex items-center gap-3 lg:gap-3.5">
    <span className={cn('shrink-0 rounded-xs px-2 py-1.5 text-title font-bold tabular-nums lg:px-2.5',
      cancelled ? 'bg-surface-container-high text-on-surface-variant line-through' : 'bg-band-tile text-on-signboard')}>{row.startTime}</span>
    <span className="flex min-w-0 flex-col text-left leading-snug">
      <h3 className="break-words font-bold lg:text-title">{row.className}</h3>
      <span className="break-words text-label text-on-surface-variant">{cancelled ? t(messages.cancelled) : facts}</span>
    </span>
  </div>
  const fill = <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-label">
            <span className="font-semibold">{t(messages.filled, { used, max: row.maxParticipants })}</span>
            <span className={cn('font-semibold', short > 0 ? 'text-warning' : 'text-primary')}>
              {short > 0 ? t(messages.minShort, { count: short, min: row.minParticipants }) : t(messages.minReached, { min: row.minParticipants })}
            </span>
          </div>
          <FillBar used={used} max={row.maxParticipants} min={row.minParticipants}
            label={t(messages.barLabel, { used, max: row.maxParticipants, min: row.minParticipants })} />
        </div>
  if (onSelect && !cancelled) return (
    <div className="flex flex-col gap-2">
      {saved && <StatusPanel tone="success" title={t(messages.saved)} />}
      <button type="button" aria-pressed={selected} onClick={onSelect}
        className={cn('state-layer flex w-full flex-col gap-3 rounded-[1rem] bg-surface-container-lowest px-[1.125rem] py-4 text-on-surface transition-shadow duration-200', selected && 'ring-2 ring-primary')}>
        {heading}{fill}
      </button>
    </div>
  )
  return (
    <article className={cn('flex flex-col gap-3 rounded-sm bg-surface-container-lowest px-4 py-3.5 lg:rounded-[1rem] lg:px-[1.125rem] lg:py-4', cancelled && onSelect && 'opacity-70')}>
      {saved && <StatusPanel tone="success" title={t(messages.saved)} />}
      {heading}
      {!cancelled && <>
        {fill}
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="tonal"><Link to={`/admin/sessions/${row.id}/roster`} viewTransition>{t(messages.participants, { count: used })}<span className="sr-only">: {row.className}, {row.startTime}</span></Link></Button>
          <Button asChild variant="outlined"><Link to={`/admin/sessions/${row.id}/edit`} viewTransition>{t(messages.edit)}<span className="sr-only">: {row.className}, {row.startTime}</span></Link></Button>
        </div>
      </>}
      {cancelled && <Button asChild variant="text" className="-ml-3 self-start"><Link to={`/admin/sessions/${row.id}/edit`}>{t(messages.edit)}<span className="sr-only">: {row.className}, {row.startTime}</span></Link></Button>}
    </article>
  )
}

export function AdminSessionsPage() {
  const { get, state: auth } = useAdminAuth()
  const { language, t } = useI18n()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const savedId = (location.state as { savedId?: string } | null)?.savedId
  const param = params.get('date')
  const [result, setResult] = useState<{ date: string; response: AdminResult<AdminSessionListResponse> } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [stripStart, setStripStart] = useState<string | null>(null)
  const today = result?.response.kind === 'ok' ? result.response.data.today : clubToday()
  const selected = isClubDate(param) ? param : today
  const data = result?.date === selected && result.response.kind === 'ok' ? result.response.data : null
  const response = result?.date === selected ? result.response : null
  const bounds = data ?? { today, ...publicScheduleWindow(today) }
  const retry = () => { setResult(null); setAttempt(value => value + 1) }
  const select = (date: string) => {
    setStripStart(computeStripWindow({ selected: date, currentStart: stripStart, ...bounds })[0])
    setParams({ date }, { preventScrollReset: true })
  }
  useEffect(() => {
    if (auth.status !== 'signedIn') return
    const controller = new AbortController()
    void get<AdminSessionListResponse>(`/api/admin/sessions?date=${encodeURIComponent(selected)}`, controller.signal).then(response => {
      if (!controller.signal.aborted) setResult({ date: selected, response })
    })
    return () => controller.abort()
  }, [get, selected, attempt, auth.status])

  const sessions = data?.sessions ?? []
  // Desktop (board D5): the day's sessions with the chosen one's players in a panel beside them.
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const [pickedId, setPickedId] = useState<string | null>(null)
  const strip = computeStripWindow({ selected, currentStart: stripStart, ...bounds })
  const panelId = isDesktop ? (sessions.find(row => row.id === pickedId && row.status === 'scheduled') ?? sessions.find(row => row.status === 'scheduled'))?.id ?? null : null
  return <>
    <AdminBand title={t(messages.heading)} wideChildren action={<TodayChip selected={selected} today={bounds.today} onSelect={select} />}
      subtitle={isDesktop && <p className="text-title font-semibold">{formatClubDateShort(strip[0], language)} - {formatClubDateShort(strip[strip.length - 1], language)}</p>}>
      <DateStrip dates={strip} selected={selected} {...bounds} onSelect={select} counts={data?.dayCounts} />
    </AdminBand>
    <div className="page-gutter desk-column mx-auto flex w-full max-w-[50rem] flex-col gap-3 py-4 lg:flex-row lg:items-start lg:gap-5 lg:pt-5">
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-col gap-1 lg:gap-2">
        <h2 className="text-title font-bold lg:text-headline">{formatClubDateMedium(selected, language)} <span className="text-label font-normal text-on-surface-variant">WIB</span></h2>
        {sessions.some(row => row.status === 'scheduled') && <Legend />}
      </div>
      {sessions.some(row => row.isSample) && <SampleDataNotice />}
      {data?.truncated && <StatusPanel tone="info" title={t(messages.truncated)} />}
      {/* A 401 sends the admin to sign-in, which explains it; no second message here meanwhile. */}
      {!response || (response.kind === 'http' && response.status === 401) ? (
        <div className="flex flex-col gap-3">
          <p role="status" className="sr-only">{t(messages.loading)}</p>
          {[0, 1].map(key => <div key={key} aria-hidden="true" className="h-44 rounded-sm bg-surface-container" />)}
        </div>
      ) : response.kind !== 'ok' ? (
        <StatusPanel tone="error" title={response.kind === 'http' ? t(apiErrorMessages[response.code] ?? apiErrorMessages.INTERNAL) : t(messages.error)}
          action={{ label: t(commonMessages.retry), onAction: retry }} />
      ) : sessions.length === 0 ? (
        <StatusPanel tone="info" title={t(messages.empty)}>
          <p>{t(messages.emptyHint)}</p>
          {data?.nextDate && <Button onClick={() => select(data.nextDate!)}>{t(messages.next)}</Button>}
        </StatusPanel>
      ) : (
        <ul className="grid gap-3" aria-label={t(messages.heading)}>
          {sessions.map(row => <li key={row.id}><SessionCard row={row} saved={savedId === row.id} selected={row.id === panelId}
            onSelect={isDesktop ? () => setPickedId(row.id) : undefined} /></li>)}
        </ul>
      )}
    </div>
    {panelId && <div className="w-[28rem] shrink-0 xl:w-[32rem]"><RosterPanel id={panelId} /></div>}
    </div>
  </>
}
