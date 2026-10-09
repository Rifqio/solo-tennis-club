import { useEffect, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Link } from 'react-router-dom'
import { AvailabilityMark } from '@/components/ui/availability-label'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { PublicSessionDetail } from '@shared/api/public'
import { SampleDataNotice } from './SampleDataNotice'
import { detailMessages as messages } from './detail.messages'
import { scheduleMessages } from './schedule.messages'
import { canBookSession } from './session-booking'
import { useNow } from './use-now'
import { useSessionPlayers } from './use-session-players'

const toneClasses = {
  available: 'text-primary',
  nearly_full: 'text-warning',
  full: 'text-on-surface',
  cancelled: 'text-on-surface-variant',
} as const

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-t border-outline-variant py-3 first:border-t-0">
      <dt className="shrink-0 text-label text-on-surface-variant">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold">{children}</dd>
    </div>
  )
}

// Who is playing: names for signed-in members (P2-10); visitors get the count and a sign-in link back to this sheet.
function Players({ session }: { session: PublicSessionDetail }) {
  const { t } = useI18n()
  const players = useSessionPlayers(session.date)
  if (players.status === 'loading' || players.status === 'unavailable') return null
  if (players.status === 'signedOut') {
    const returnTo = `/?${new URLSearchParams({ date: session.date, session: session.id })}`
    return (
      <Link to={`/customer/sign-in?returnTo=${encodeURIComponent(returnTo)}`} className="state-layer pressable flex min-h-12 items-center rounded-sm bg-surface px-3 text-label font-semibold text-primary">
        {t(messages.signInToSee)}
      </Link>
    )
  }
  const names = players.sessions[session.id] ?? []
  return (
    <section aria-labelledby="session-players" className="flex flex-col gap-2 rounded-sm bg-surface p-3">
      <h3 id="session-players" className="text-label font-semibold">{t(messages.players, { count: names.length })}</h3>
      {names.length === 0
        ? <p className="text-label text-on-surface-variant">{t(messages.playersEmpty)}</p>
        : <ul className="flex flex-wrap gap-1.5">
            {names.map((name, index) => <li key={index} className="max-w-full break-words rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 text-label">{name}</li>)}
          </ul>}
    </section>
  )
}

export function SessionDetailSheet({ id, onClose, returnFocus }: {
  id: string | null; onClose: () => void; returnFocus: RefObject<HTMLElement | null>
}) {
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

  const data = result?.id === id ? result.data : null
  const valid = data && data.coaches && Number.isSafeInteger(data.priceIdr) && Number.isSafeInteger(data.maxParticipants)
    && Number.isSafeInteger(data.minParticipants) && Number.isSafeInteger(data.durationMinutes)
    && Number.isFinite(Date.parse(data.startsAt)) && Number.isFinite(Date.parse(data.endsAt))
  const ready = valid ? data : null
  const ended = ready !== null && Date.parse(ready.endsAt) <= now
  const bookable = ready !== null && !ended && canBookSession(ready, now)
  const close = () => { setResult(null); onClose() }

  // Why there is no Pesan button, in the order a member would want to know it.
  const blocked = ready === null || bookable ? null
    : ready.availability === 'cancelled' ? messages.cancelled
    : ended ? messages.ended
    : ready.availability === 'full' ? messages.full
    : messages.closedReason

  // Four facts in a 2 x 2 grid of Deep Court tiles: small label, large value, room to breathe.
  const open = ready !== null && (ready.availability === 'available' || ready.availability === 'nearly_full')
  const slotValue = ready === null ? '' : ended ? t(scheduleMessages.ended)
    : open ? t(messages.slotsLeft, { count: ready.remainingPlaces }) : t(scheduleMessages.status[ready.availability])
  const tiles = ready ? [
    { label: t(messages.date), value: formatClubDateShort(ready.date, language) },
    { label: t(messages.time), value: `${ready.startTime}-${ready.endTime}` },
    { label: t(messages.duration), value: t(messages.minutes, { count: ready.durationMinutes }) },
    { label: t(messages.slots), value: slotValue },
  ] : []
  const band = ready && (
    <dl className="grid grid-cols-2 gap-2">
      {tiles.map(tile => (
        <div key={tile.label} className="flex min-w-0 flex-col gap-0.5 rounded-sm bg-band-tile px-3 py-2.5">
          <dt className="text-label">{tile.label}</dt>
          <dd className="truncate text-title font-bold tabular-nums">{tile.value}</dd>
        </div>
      ))}
    </dl>
  )

  const footer = ready && (
    bookable ? (
      <div className="flex items-center justify-between gap-3">
        <p className="flex flex-col leading-tight">
          <span className="text-title font-bold tabular-nums">{formatIdr(ready.priceIdr, language)}</span>
          <span className="text-label text-on-surface-variant">{t(scheduleMessages.perPlace)}</span>
        </p>
        <Button asChild variant="filled" className="px-7">
          <Link to={`/book/${encodeURIComponent(ready.id)}?date=${encodeURIComponent(ready.date)}`} onClick={onClose}>{t(messages.choosePlaces)}</Link>
        </Button>
      </div>
    ) : (
      <p role="note" className="flex min-h-12 items-center justify-center rounded-sm bg-surface-container px-4 text-center font-semibold text-on-surface-variant">{blocked && t(blocked)}</p>
    )
  )

  return (
    <Sheet
      open={id !== null}
      onClose={close}
      title={ready?.className || t(messages.title)}
      description={t(messages.description)}
      closeLabel={t(messages.close)}
      returnFocus={returnFocus}
      tone="court"
      band={band}
      footer={footer}
    >
      {!result || result.id !== id ? <p role="status">{t(messages.loading)}</p>
        : result.missing ? <StatusPanel tone="info" title={t(messages.missing)} />
        : !data ? <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: () => setAttempt(value => value + 1) }} />
        : !ready ? <StatusPanel tone="error" title={t(messages.incomplete)} action={{ label: t(commonMessages.retry), onAction: () => setAttempt(value => value + 1) }} />
        : <>
          {ready.isSample && <SampleDataNotice />}
          <p className={cn('flex flex-wrap items-center gap-x-2 text-label', toneClasses[ready.availability])}>
            <AvailabilityMark availability={ready.availability} />
            <span className="font-semibold">{t(scheduleMessages.status[ready.availability])}</span>
          </p>
          {ready.availability === 'cancelled' && <p className="text-on-surface-variant">{t(scheduleMessages.cancelledExplanation)}</p>}
          {ready.availability !== 'cancelled' && <Players session={ready} />}
          <dl className="-mt-2 flex flex-col">
            <Fact label={t(messages.level)}>{ready.levelName}</Fact>
            <Fact label={t(messages.venue)}>
              {ready.venueName}
              {ready.venueAddress && <span className="block text-label font-normal text-on-surface-variant">{ready.venueAddress}</span>}
            </Fact>
            <Fact label={t(messages.coaches)}>{ready.coaches.length ? ready.coaches.join(', ') : t(commonMessages.unavailable)}</Fact>
            <Fact label={t(messages.group)}>{t(messages.groupLimits, { min: ready.minParticipants, max: ready.maxParticipants })}</Fact>
            {!bookable && <Fact label={t(messages.price)}>{formatIdr(ready.priceIdr, language)}</Fact>}
          </dl>
        </>}
    </Sheet>
  )
}
