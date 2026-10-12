import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Scoreboard } from '@/components/ui/scoreboard'
import { EmptyState } from '@/components/ui/empty-state'
import { Sheet } from '@/components/ui/sheet'
import { SlowNotice } from '@/components/ui/slow-notice'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { clubDayOfMonth, formatClubDateMedium, formatClubWeekdayShort, formatRemainingPlaces } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import type { PublicSessionSummary } from '@shared/api/public'
import { publicMessages } from './public.messages'
import { useUpcoming } from './use-upcoming'

function UpcomingRow({ session, onChoose }: { session: PublicSessionSummary; onChoose: () => void }) {
  const { language } = useI18n()
  return (
    <li>
      <Link
        to={`/book/${encodeURIComponent(session.id)}`}
        viewTransition
        data-nav="push"
        onClick={onChoose}
        className="state-layer pressable flex min-h-18 items-center gap-3 rounded-sm bg-surface-container-lowest p-2 pr-3"
      >
        <span className="sr-only">{formatClubDateMedium(session.date, language)}, </span>
        <span aria-hidden="true" className="flex w-12 shrink-0 flex-col items-center rounded-xs bg-band-tile py-1.5 text-on-signboard">
          <span className="text-label">{formatClubWeekdayShort(session.date, language)}</span>
          <span className="text-title font-bold tabular-nums leading-none">{clubDayOfMonth(session.date)}</span>
        </span>
        <Scoreboard time={session.startTime} size="sm" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold text-on-surface">{session.className}</span>
          <span className="truncate text-label text-on-surface-variant">{formatRemainingPlaces(session.remainingPlaces, language)}</span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-on-surface-variant" />
      </Link>
    </li>
  )
}

// Opened by the dock's book button: the next sessions the server says can still be booked (scheduled, places left,
// before the five-hour cutoff). Choosing one goes straight to its booking flow.
export function BookSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const upcoming = useUpcoming(open)
  return (
    <Sheet open={open} onClose={onClose} title={t(publicMessages.bookSheetTitle)} description={t(publicMessages.bookSheetDescription)} closeLabel={t(publicMessages.bookSheetClose)} closeIcon>
      {upcoming.status === 'loading' ? (
        <>
          <p role="status" className="sr-only">{t(publicMessages.bookSheetLoading)}</p>
          <ul aria-hidden="true" className="skeleton-in flex flex-col gap-2">
            {[0, 1, 2].map(index => (
              <li key={index} className="flex min-h-18 items-center gap-3 rounded-sm bg-surface-container-lowest p-2 pr-3">
                <span className="skeleton h-13 w-12 shrink-0 rounded-xs" />
                <span className="flex flex-1 flex-col gap-2"><span className="skeleton h-3.5 w-3/5 rounded-xs" /><span className="skeleton h-3 w-2/5 rounded-xs" /></span>
              </li>
            ))}
          </ul>
          <SlowNotice onRetry={upcoming.retry} />
        </>
      ) : upcoming.status === 'error' ? (
        <StatusPanel tone="error" title={t(publicMessages.bookSheetError)} action={{ label: t(commonMessages.retry), onAction: upcoming.retry }} />
      ) : upcoming.data.sessions.length === 0 ? (
        <EmptyState scene="no-sessions" compact title={t(publicMessages.bookSheetEmpty)} body={t(publicMessages.bookSheetEmptyBody)}
          action={<Button asChild variant="outlined"><Link to="/schedule" viewTransition data-nav="tab" onClick={onClose}>{t(publicMessages.seeSchedule)}</Link></Button>} />
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {upcoming.data.sessions.map(session => <UpcomingRow key={session.id} session={session} onChoose={onClose} />)}
          </ul>
          <p className="text-label text-on-surface-variant">{t(publicMessages.bookSheetCutoff)}</p>
        </>
      )}
    </Sheet>
  )
}
