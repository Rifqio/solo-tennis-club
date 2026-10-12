import { AnimatePresence, m } from 'motion/react'
import type { PublicSessionSummary } from '@shared/api/public'
import { listRowMotion } from '@/lib/motion'
import { SessionCard } from './SessionCard'
import type { SessionTiming } from './session-timing'

interface ScheduleListProps {
  sessions: PublicSessionSummary[]
  timings: Map<string, SessionTiming> | null
  now: number
  markedId: string | null
  players?: Record<string, string[]>
  onOpen: (id: string, trigger: HTMLButtonElement) => void
}

// Server order is startsAt then id; the list keeps it, one column on phones and two from 1024px.
// Cards filtered out by level or availability leave with a short fade while the rest close the gap.
export function ScheduleList({ sessions, timings, now, markedId, players, onOpen }: ScheduleListProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-6">
      <AnimatePresence initial={false} mode="popLayout">
        {sessions.map(session => (
          <m.li key={session.id} {...listRowMotion}>
            <SessionCard session={session} timing={timings?.get(session.id)} now={now} marked={session.id === markedId} players={players?.[session.id]} onOpen={onOpen} />
          </m.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

// Placeholders shaped like scoreboard cards while a date loads (G3 skeleton: 300ms wait, then one soft sweep).
export function ScheduleListPlaceholder() {
  return (
    <ul aria-hidden="true" className="skeleton-in grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-6">
      {[0, 1, 2].map(index => (
        <li key={index} className="flex flex-col gap-3 rounded-sm bg-surface-container-lowest p-4">
          <div className="flex gap-0.5"><div className="skeleton size-12 rounded-xs" /><div className="skeleton ml-2 size-12 rounded-xs" /></div>
          <div className="skeleton h-6 w-3/4 rounded-xs" />
          <div className="skeleton h-4 w-1/2 rounded-xs" />
          <div className="skeleton h-4 w-2/5 rounded-xs" />
        </li>
      ))}
    </ul>
  )
}
