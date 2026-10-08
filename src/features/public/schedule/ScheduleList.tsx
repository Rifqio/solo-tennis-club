import type { PublicSessionSummary } from '@shared/api/public'
import { SessionSummaryRow } from './SessionSummaryRow'
import type { SessionTiming } from './session-timing'

// Server order is startsAt then id; the list keeps it, one column on phones and two from 1024px.
export function ScheduleList({ sessions, timings, now }: { sessions: PublicSessionSummary[]; timings: Map<string, SessionTiming> | null; now: number }) {
  return (
    <ul className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-10">
      {sessions.map(session => (
        <SessionSummaryRow key={session.id} session={session} timing={timings?.get(session.id)} now={now} className="border-t border-outline-variant first:border-t-0 lg:[&:nth-child(2)]:border-t-0" />
      ))}
    </ul>
  )
}

// Static placeholders shaped like plates and facts while a date loads; no shimmer or pulse.
export function ScheduleListPlaceholder() {
  return (
    <ul aria-hidden="true" className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-10">
      {[0, 1, 2, 3].map(index => (
        <li key={index} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4 border-t border-outline-variant py-4 first:border-t-0 sm:grid-cols-[6rem_minmax(0,1fr)] lg:[&:nth-child(2)]:border-t-0">
          <div className="h-[4.75rem] rounded-md bg-surface-container-high" />
          <div className="flex flex-col gap-2 pt-1">
            <div className="h-6 w-3/4 rounded-xs bg-surface-container-high" />
            <div className="h-4 w-1/2 rounded-xs bg-surface-container" />
            <div className="h-4 w-2/5 rounded-xs bg-surface-container" />
          </div>
        </li>
      ))}
    </ul>
  )
}
