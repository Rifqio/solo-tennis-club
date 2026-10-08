import { CircleCheck } from 'lucide-react'
import { AvailabilityLabel } from '@/components/ui/availability-label'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubTime, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { PublicSessionSummary } from '@shared/api/public'
import { scheduleMessages } from './schedule.messages'
import { minutesUntil } from './session-timing'
import type { SessionTiming } from './session-timing'

function present(value: string | null | undefined) {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

interface SessionSummaryRowProps {
  session: PublicSessionSummary
  // Only set when the list shows today; other dates have no "now" on the trail.
  timing?: SessionTiming
  now: number
  className?: string
}

// The signature: each session hangs from a tonal trail-post plate carrying its start time. Facts read beside it;
// availability sits in its own cell (a third column from 640px, one unit under the facts on phones).
export function SessionSummaryRow({ session, timing, now, className }: SessionSummaryRowProps) {
  const { language, t } = useI18n()
  const unavailable = t(commonMessages.unavailable)
  const cancelled = session.availability === 'cancelled'
  const ended = timing === 'ended' && !cancelled
  const remaining = Number.isSafeInteger(session.remainingPlaces) ? session.remainingPlaces : null
  const price = Number.isSafeInteger(session.priceIdr) ? formatIdr(session.priceIdr, language) : null

  const timeToGo = () => {
    const minutes = minutesUntil(session.startsAt, now)
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? t(scheduleMessages.hoursMinutes, { h, m }) : t(scheduleMessages.minutesOnly, { m })
  }

  return (
    <li className={cn('grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4 gap-y-2 py-4 sm:grid-cols-[6rem_minmax(0,1fr)_9rem]', className)}>
      <div className={cn(
        'row-span-2 flex flex-col items-center justify-center self-start rounded-md px-1 py-3 sm:row-span-1',
        cancelled ? 'border border-dashed border-outline text-on-surface-variant'
          : ended ? 'bg-surface-container-high text-on-surface-variant'
          : 'bg-plate text-on-plate',
      )}>
        <p className="font-display text-numeral font-bold tabular-nums">{formatClubTime(session.startsAt)}</p>
        <p className="mt-1 text-label tabular-nums">{t(scheduleMessages.until)} {formatClubTime(session.endsAt)}</p>
      </div>

      <div className="flex min-w-0 flex-col gap-1 break-words">
        <h3 className={cn('text-title font-bold', ended ? 'text-on-surface-variant' : 'text-on-surface')}>{present(session.className) ?? unavailable}</h3>
        <p className="text-on-surface-variant">
          <span className="sr-only">{t(scheduleMessages.level)}: </span>{present(session.levelName) ?? unavailable}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, {t(scheduleMessages.venue)}: </span>{present(session.venueName) ?? unavailable}
        </p>
        <p className="text-on-surface">
          <span className="sr-only">{t(scheduleMessages.pricePerPlace)}: </span>
          <span className="font-bold tabular-nums">{price ?? unavailable}</span>
          {price && <span className="text-on-surface-variant"> {t(scheduleMessages.perPlace)}</span>}
        </p>
        {cancelled && <p className="text-label text-on-surface-variant">{t(scheduleMessages.cancelledExplanation)}</p>}
      </div>

      {/* The state cell: where the session stands now (today only) and its places. An ended session claims no places. */}
      <div className="col-start-2 flex flex-col gap-0.5 sm:col-start-3 sm:row-start-1 sm:pt-1">
        {ended ? (
          <p className="inline-flex items-center gap-1.5 text-label font-bold text-on-surface-variant">
            <CircleCheck aria-hidden="true" className="size-4" strokeWidth={2} />
            {t(scheduleMessages.ended)}
          </p>
        ) : (
          <AvailabilityLabel availability={session.availability} remainingPlaces={remaining} />
        )}
        {timing === 'next' && !cancelled && (
          <p className="text-label font-bold text-primary">{t(scheduleMessages.next)} · {t(scheduleMessages.startsIn, { time: timeToGo() })}</p>
        )}
        {timing === 'in_progress' && !cancelled && <p className="text-label font-bold text-primary">{t(scheduleMessages.inProgress)}</p>}
      </div>
    </li>
  )
}
