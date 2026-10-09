import { AnimatePresence, m } from 'motion/react'
import type { PublicSessionSummary } from '@shared/api/public'
import { contentSpring } from '@/lib/motion'
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
          <m.li
            key={session.id}
            layout="position"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
            transition={contentSpring}
          >
            <SessionCard session={session} timing={timings?.get(session.id)} now={now} marked={session.id === markedId} players={players?.[session.id]} onOpen={onOpen} />
          </m.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

// Static placeholders shaped like scoreboard cards while a date loads; no shimmer or pulse.
export function ScheduleListPlaceholder() {
  return (
    <ul aria-hidden="true" className="appear-late grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-6">
      {[0, 1, 2].map(index => (
        <li key={index} className="flex flex-col gap-3 rounded-sm bg-surface-container-lowest p-4">
          <div className="flex gap-0.5"><div className="size-12 rounded-xs bg-surface-container-high" /><div className="ml-2 size-12 rounded-xs bg-surface-container-high" /></div>
          <div className="h-6 w-3/4 rounded-xs bg-surface-container-high" />
          <div className="h-4 w-1/2 rounded-xs bg-surface-container" />
          <div className="h-4 w-2/5 rounded-xs bg-surface-container" />
        </li>
      ))}
    </ul>
  )
}
