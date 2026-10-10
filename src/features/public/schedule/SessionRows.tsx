import { ChevronRight } from 'lucide-react'
import { commonMessages } from '@/i18n/common.messages'
import { formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { PublicSessionSummary } from '@shared/api/public'
import { detailMessages } from './detail.messages'
import { scheduleMessages } from './schedule.messages'
import type { SessionTiming } from './session-timing'

interface SessionRowsProps {
  sessions: PublicSessionSummary[]
  timings: Map<string, SessionTiming> | null
  selectedId: string | null
  onSelect: (id: string) => void
}

function present(value: string | null | undefined) {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function minutesOf(session: PublicSessionSummary) {
  return Math.round((Date.parse(session.endsAt) - Date.parse(session.startsAt)) / 60_000)
}

// Desktop: the day as numbered rows on hairlines. Choosing a row fills the detail panel beside the list; the chosen
// row turns Deep Court with its time cell in white, so the pair reads as one selection. Like the phone cards, each
// class name is a heading and the whole row is chosen through a stretched button underneath it.
export function SessionRows({ sessions, timings, selectedId, onSelect }: SessionRowsProps) {
  const { language, t } = useI18n()
  const unavailable = t(commonMessages.unavailable)
  return (
    <ol className="flex flex-col border-t border-outline-variant">
      {sessions.map((session, index) => {
        const selected = session.id === selectedId
        const name = present(session.className) ?? unavailable
        const ended = timings?.get(session.id) === 'ended' && session.availability !== 'cancelled'
        const closed = ended || session.availability === 'cancelled' || session.availability === 'full'
        const open = session.availability === 'available' || session.availability === 'nearly_full'
        const status = ended ? t(scheduleMessages.ended)
          : open ? (Number.isSafeInteger(session.remainingPlaces) ? t(detailMessages.slotsLeft, { count: session.remainingPlaces }) : t(scheduleMessages.status[session.availability]))
          : t(scheduleMessages.status[session.availability])
        return (
          <li key={session.id} className="border-b border-outline-variant py-1">
            <div className={cn(
              'relative grid min-h-20 grid-cols-[2rem_5.5rem_minmax(0,1fr)_auto_1.25rem] items-center gap-4 rounded-sm px-4 py-3 transition-colors duration-200',
              selected ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-lowest',
            )}>
              <button type="button" aria-pressed={selected} aria-label={t(scheduleMessages.openDetail, { name, time: session.startTime })} onClick={() => onSelect(session.id)}
                className={cn('pressable absolute inset-0 rounded-sm', !selected && 'state-layer')} />
              <span className="pointer-events-none relative text-label font-semibold tabular-nums opacity-80">{String(index + 1).padStart(2, '0')}</span>
              <span className={cn(
                'pointer-events-none relative justify-self-start rounded-xs px-2.5 py-1.5 text-title font-bold tabular-nums',
                selected ? 'bg-surface-container-lowest text-primary'
                  : closed ? cn('bg-surface-container-high text-on-surface-variant', session.availability !== 'full' && 'line-through')
                  : 'bg-band-tile text-on-signboard',
              )}>{session.startTime}</span>
              <span className="pointer-events-none relative flex min-w-0 flex-col leading-snug">
                <h3 className="break-words text-title font-bold">{name}</h3>
                <span className={cn('text-label', selected ? 'text-on-primary' : 'text-on-surface-variant')}>
                  {present(session.levelName) ?? unavailable} · {present(session.venueName) ?? unavailable} · {t(detailMessages.minutes, { count: minutesOf(session) })}
                  {' · '}<span className="font-semibold tabular-nums">{Number.isSafeInteger(session.priceIdr) ? formatIdr(session.priceIdr, language) : unavailable}</span> {t(scheduleMessages.perPlace)}
                </span>
              </span>
              <span className={cn('pointer-events-none relative whitespace-nowrap text-label font-semibold', selected ? 'text-on-primary' : closed ? 'text-on-surface-variant' : 'text-primary')}>{status}</span>
              <ChevronRight aria-hidden="true" className="pointer-events-none relative size-5" strokeWidth={2.25} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}
