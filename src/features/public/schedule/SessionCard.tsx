import { CircleCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AvailabilityLabel } from '@/components/ui/availability-label'
import { Button } from '@/components/ui/button'
import { Scoreboard } from '@/components/ui/scoreboard'
import { commonMessages } from '@/i18n/common.messages'
import { formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { PublicSessionSummary } from '@shared/api/public'
import { scheduleMessages } from './schedule.messages'
import { canBookSession } from './session-booking'
import { minutesUntil } from './session-timing'
import type { SessionTiming } from './session-timing'

function present(value: string | null | undefined) {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

interface SessionCardProps {
  session: PublicSessionSummary
  // Only set when the list shows today; other dates have no "now".
  timing?: SessionTiming
  now: number
  marked?: boolean
  onOpen: (id: string, trigger: HTMLButtonElement) => void
}

// The scoreboard card: start time in two lime-on-ink cells, then the facts, the state cell and, when the session can
// still be booked, a Pesan button straight to booking. The whole card opens the detail sheet through a stretched
// button underneath, so the Pesan link is never nested inside another control.
export function SessionCard({ session, timing, now, marked = false, onOpen }: SessionCardProps) {
  const { language, t } = useI18n()
  const unavailable = t(commonMessages.unavailable)
  const cancelled = session.availability === 'cancelled'
  const ended = timing === 'ended' && !cancelled
  const name = present(session.className) ?? unavailable
  const remaining = Number.isSafeInteger(session.remainingPlaces) ? session.remainingPlaces : null
  const price = Number.isSafeInteger(session.priceIdr) ? formatIdr(session.priceIdr, language) : null
  const bookable = !ended && timing !== 'in_progress' && canBookSession(session, now)
  const closedEarly = !bookable && !ended && !cancelled && session.availability !== 'full' && timing !== 'in_progress'

  const timeToGo = () => {
    const minutes = minutesUntil(session.startsAt, now)
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? t(scheduleMessages.hoursMinutes, { h, m }) : t(scheduleMessages.minutesOnly, { m })
  }

  return (
    <article
      data-session-card={session.id}
      className={cn(
        'relative flex scroll-mt-4 flex-col gap-3 rounded-sm bg-surface-container-lowest p-4',
        marked && 'ring-2 ring-inset ring-on-surface',
      )}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={t(scheduleMessages.openDetail, { name, time: session.startTime })}
        onClick={event => onOpen(session.id, event.currentTarget)}
        className="state-layer pressable absolute inset-0 rounded-sm"
      />

      <div className="pointer-events-none relative flex items-center gap-3">
        <Scoreboard time={session.startTime} tone={cancelled ? 'cancelled' : ended ? 'ended' : 'live'} />
        <p className="text-label tabular-nums text-on-surface-variant">{t(scheduleMessages.until)} {session.endTime}</p>
      </div>

      <div className="pointer-events-none relative flex min-w-0 flex-col gap-0.5 break-words">
        <h3 className={cn('text-title font-semibold', ended ? 'text-on-surface-variant' : 'text-on-surface')}>{name}</h3>
        <p className="text-on-surface-variant">
          <span className="sr-only">{t(scheduleMessages.level)}: </span>{present(session.levelName) ?? unavailable}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, {t(scheduleMessages.venue)}: </span>{present(session.venueName) ?? unavailable}
        </p>
        <p className="text-on-surface">
          <span className="sr-only">{t(scheduleMessages.pricePerPlace)}: </span>
          <span className="font-semibold tabular-nums">{price ?? unavailable}</span>
          {price && <span className="text-on-surface-variant"> {t(scheduleMessages.perPlace)}</span>}
        </p>
        {cancelled && <p className="text-label text-on-surface-variant">{t(scheduleMessages.cancelledExplanation)}</p>}
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div className="pointer-events-none flex min-w-0 flex-col gap-0.5">
          {ended ? (
            <p className="inline-flex items-center gap-1.5 text-label font-semibold text-on-surface-variant">
              <CircleCheck aria-hidden="true" className="size-4" strokeWidth={2} />
              {t(scheduleMessages.ended)}
            </p>
          ) : (
            <AvailabilityLabel availability={session.availability} remainingPlaces={remaining} className="sm:flex-row sm:items-center" />
          )}
          {timing === 'next' && !cancelled && (
            <p className="text-label font-semibold text-primary">{t(scheduleMessages.next)} · {t(scheduleMessages.startsIn, { time: timeToGo() })}</p>
          )}
          {timing === 'in_progress' && !cancelled && <p className="text-label font-semibold text-primary">{t(scheduleMessages.inProgress)}</p>}
          {closedEarly && <p className="text-label text-on-surface-variant">{t(scheduleMessages.bookingClosed)}</p>}
        </div>
        {bookable && (
          <Button asChild variant="filled" className="px-6">
            <Link to={`/book/${encodeURIComponent(session.id)}?date=${session.date}`} aria-label={t(scheduleMessages.bookSession, { name, time: session.startTime })}>
              {t(scheduleMessages.book)}
            </Link>
          </Button>
        )}
      </div>
    </article>
  )
}
