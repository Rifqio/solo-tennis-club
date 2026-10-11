import { venueMapsHref } from '@shared/maps'
import { ExternalLink, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AvailabilityMark } from '@/components/ui/availability-label'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { PublicSessionDetail, PublicSessionSummary } from '@shared/api/public'
import { SampleDataNotice } from './SampleDataNotice'
import { detailMessages as messages } from './detail.messages'
import { scheduleMessages } from './schedule.messages'
import { canBookSession } from './session-booking'
import { useNow } from './use-now'
import { Fact, Pending, Players } from './session-detail-parts'
import type { SessionPlayers } from './use-session-players'

const toneClasses = {
  available: 'text-primary',
  nearly_full: 'text-warning',
  full: 'text-on-surface',
  cancelled: 'text-on-surface-variant',
} as const

interface SessionDetailOptions {
  id: string | null
  // The card's own summary. With it the sheet opens already filled at full height, and only the detail-only facts
  // (group limits, address, coaches) arrive afterwards, so nothing jumps while the sheet is rising.
  seed?: PublicSessionSummary | null
  // Player names the schedule already loaded for this day; skips a second request.
  knownPlayers?: { date: string; state: SessionPlayers }
  // Called when the member follows the Pesan slot link (the sheet closes itself first).
  onLeave?: () => void
  // The desktop panel sits beside the list, which already carries the sample-data notice.
  hideSampleNotice?: boolean
}

function durationOf(session: PublicSessionSummary) {
  return Math.round((Date.parse(session.endsAt) - Date.parse(session.startsAt)) / 60_000)
}

export function useSessionDetailContent({ id, seed = null, knownPlayers, onLeave, hideSampleNotice = false }: SessionDetailOptions) {
  const { language, t } = useI18n()
  const now = useNow()
  const [result, setResult] = useState<{ id: string; data?: PublicSessionDetail; missing?: boolean } | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    void fetch(`/api/public/sessions/${encodeURIComponent(id)}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) { if (!controller.signal.aborted) setResult({ id, missing: response.status === 404 }); return }
        const data = await response.json() as PublicSessionDetail
        if (!controller.signal.aborted) setResult({ id, data })
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ id }) })
    return () => controller.abort()
  }, [id, attempt])

  const settled = result?.id === id ? result : null
  const data = settled?.data ?? null
  // A detail missing any fact the sheet shows is treated as incomplete: the card's summary stays and a retry is offered.
  const valid = data && data.coaches && data.venueName && Number.isSafeInteger(data.remainingPlaces) && Number.isSafeInteger(data.priceIdr) && Number.isSafeInteger(data.maxParticipants)
    && Number.isSafeInteger(data.minParticipants) && Number.isSafeInteger(data.durationMinutes)
    && Number.isFinite(Date.parse(data.startsAt)) && Number.isFinite(Date.parse(data.endsAt))
  const detail = valid ? data : null
  // What the sheet shows right away: the full detail once it has arrived, otherwise the card's summary.
  const view: PublicSessionSummary | null = detail ?? (seed && seed.id === id ? seed : null)
  const failed = settled !== null && !detail
  const ended = view !== null && Date.parse(view.endsAt) <= now
  const bookable = view !== null && !ended && canBookSession(view, now)

  // Why there is no Pesan button, in the order a member would want to know it.
  const blocked = view === null || bookable ? null
    // Cancelled: the status line already says it, so the foot says what to do instead.
    : view.availability === 'cancelled' ? scheduleMessages.cancelledExplanation
    : ended ? messages.ended
    : view.availability === 'full' ? messages.full
    : messages.closedReason

  // Four facts in a 2 x 2 grid of Deep Court tiles: small label, large value, room to breathe.
  const open = view !== null && (view.availability === 'available' || view.availability === 'nearly_full')
  const slotValue = view === null ? '' : ended ? t(scheduleMessages.ended)
    : open && Number.isSafeInteger(view.remainingPlaces) ? t(messages.slotsLeft, { count: view.remainingPlaces }) : t(scheduleMessages.status[view.availability])
  const tiles = view ? [
    { label: t(messages.date), value: formatClubDateShort(view.date, language) },
    { label: t(messages.time), value: `${view.startTime}-${view.endTime}` },
    { label: t(messages.duration), value: t(messages.minutes, { count: detail?.durationMinutes ?? durationOf(view) }) },
    { label: t(messages.slots), value: slotValue },
  ] : []
  const band = view && (
    <dl className="grid grid-cols-2 gap-2">
      {tiles.map(tile => (
        <div key={tile.label} className="flex min-w-0 flex-col gap-0.5 rounded-sm bg-band-tile px-3 py-2.5">
          <dt className="text-label">{tile.label}</dt>
          <dd className="truncate text-title font-bold tabular-nums">{tile.value}</dd>
        </div>
      ))}
    </dl>
  )

  const footer = view && (
    bookable ? (
      <div className="flex items-center justify-between gap-3">
        <p className="flex flex-col leading-tight">
          <span className="text-title font-bold tabular-nums">{formatIdr(view.priceIdr, language)}</span>
          <span className="text-label text-on-surface-variant">{t(scheduleMessages.perPlace)}</span>
        </p>
        <Button asChild variant="filled" className="px-7">
          <Link to={`/book/${encodeURIComponent(view.id)}?date=${encodeURIComponent(view.date)}`} viewTransition data-nav="push" onClick={onLeave}>{t(messages.choosePlaces)}</Link>
        </Button>
      </div>
    ) : (
      <p role="note" className="flex min-h-12 items-center justify-center rounded-sm bg-surface-container px-4 text-center font-semibold text-on-surface-variant">{blocked && t(blocked)}</p>
    )
  )

  const retry = () => setAttempt(value => value + 1)
  let body: ReactNode
  if (settled?.missing) body = <StatusPanel tone="info" title={t(messages.missing)} />
  else if (!view && failed) body = <StatusPanel tone="error" title={t(data ? messages.incomplete : messages.error)} action={{ label: t(commonMessages.retry), onAction: retry }} />
  else if (!view) {
    // Opened from a link, with no card to borrow from: placeholders shaped like the sheet hold its height.
    body = <>
      <p role="status" className="sr-only">{t(messages.loading)}</p>
      <div aria-hidden="true" className="appear-late flex flex-col gap-4">
        <div className="h-6 w-1/3 rounded-xs bg-surface-container-high" />
        <div className="h-20 rounded-sm bg-surface-container" />
        {[0, 1, 2].map(index => <div key={index} className="h-6 rounded-xs bg-surface-container" />)}
      </div>
    </>
  } else {
    body = <>
      {view.isSample && !hideSampleNotice && <SampleDataNotice />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn('flex items-center gap-2 text-label', toneClasses[view.availability])}>
          <AvailabilityMark availability={view.availability} />
          <span className="font-semibold">{t(scheduleMessages.status[view.availability])}</span>
        </p>
        <p className="flex min-h-8 items-center gap-1.5 rounded-full border border-outline-variant bg-surface px-3 py-1 text-label font-semibold">
          <UsersRound aria-hidden="true" className="size-4 text-on-surface-variant" />
          {detail ? <>
            <span aria-hidden="true">{t(messages.groupShort, { min: detail.minParticipants, max: detail.maxParticipants })}</span>
            <span className="sr-only">{t(messages.group)}: {t(messages.groupLimits, { min: detail.minParticipants, max: detail.maxParticipants })}</span>
          </> : <Pending className="w-20" />}
        </p>
      </div>
      {view.availability !== 'cancelled' && <Players session={view} known={knownPlayers?.date === view.date ? knownPlayers.state : undefined} />}
      <dl className="-mt-2 flex flex-col">
        <Fact label={t(messages.level)}>{view.levelName}</Fact>
        <Fact label={t(messages.venue)}>
          <a href={venueMapsHref(view.venueName, detail?.venueMapUrl, detail?.venueAddress)} target="_blank" rel="noopener noreferrer"
            aria-label={t(messages.openMapsLabel, { venue: view.venueName })}
            className="state-layer -my-1 inline-flex min-h-12 flex-col items-end justify-center rounded-xs py-1">
            <span>{view.venueName}</span>
            {detail?.venueAddress && <span className="text-label font-normal text-on-surface-variant">{detail.venueAddress}</span>}
            <span className="inline-flex items-center gap-1 text-label text-primary">{t(messages.openMaps)}<ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={2.25} /></span>
          </a>
        </Fact>
        <Fact label={t(messages.coaches)}>
          {detail ? (detail.coaches.length ? detail.coaches.join(', ') : t(commonMessages.unavailable)) : <Pending className="w-32" />}
        </Fact>
        {!bookable && <Fact label={t(messages.price)}>{formatIdr(view.priceIdr, language)}</Fact>}
      </dl>
      {/* The card's own facts are on screen and still true; only the extra details are missing, so this informs
          rather than alarms, and booking stays possible. */}
      {failed && <StatusPanel tone="info" title={t(messages.partial)} action={{ label: t(commonMessages.retry), onAction: retry }} />}
    </>
  }

  return { title: view?.className || t(messages.title), band, body, footer, reset: () => setResult(null) }
}
