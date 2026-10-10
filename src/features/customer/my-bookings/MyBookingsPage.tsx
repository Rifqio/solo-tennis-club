import { ChevronRight, Clock3, MessageCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { clubDayOfMonth, formatClubTime, formatClubWeekdayShort } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { Language } from '@/i18n/types'
import type { CustomerBookingItem, CustomerBookingView } from '@shared/api/customer-bookings'
import { clubDateOf } from '@shared/club-time'
import { CourtBand } from '@/features/public/layout/CourtBand'
import { useNow } from '@/features/public/schedule/use-now'
import { clubContent } from '@/features/public/club/club-content'
import { myBookingsMessages as messages } from './my-bookings.messages'
import { serverClock, useCustomerBookings } from './use-customer-bookings'

// "Batas 11:00" when the deadline is today, "Batas Sab 11:00" when it is another day.
function deadlineLabel(deadline: string, now: number, language: Language) {
  const date = clubDateOf(new Date(deadline))
  const time = formatClubTime(deadline)
  return date === clubDateOf(new Date(now)) ? time : `${formatClubWeekdayShort(date, language)} ${time}`
}

function DateTile({ date, muted }: { date: string; muted?: boolean }) {
  const { language } = useI18n()
  return (
    <span aria-hidden="true" className={cn('flex w-12 shrink-0 flex-col items-center rounded-xs py-1.5 leading-tight',
      muted ? 'bg-surface-container-high text-on-surface-variant' : 'bg-band-tile text-on-signboard')}>
      <span className="text-label">{formatClubWeekdayShort(date, language)}</span>
      <span className="text-title font-bold tabular-nums">{clubDayOfMonth(date)}</span>
    </span>
  )
}

function ActiveCard({ booking, now }: { booking: CustomerBookingItem; now: number }) {
  const { language, t } = useI18n()
  const { session } = booking
  const unpaid = booking.status === 'awaiting_payment'
  const whatsapp = clubContent.whatsapp ? `https://wa.me/${clubContent.whatsapp}` : null
  return (
    <article className={cn('overflow-hidden rounded-sm bg-surface-container-lowest', unpaid && 'border border-warning/40')}>
      <Link to={`/bookings/${booking.id}`} viewTransition className="state-layer flex items-start gap-3 px-4 py-3.5">
        <DateTile date={session.date} />
        <span className="flex min-w-0 flex-1 flex-col leading-snug">
          <span className="flex items-start justify-between gap-2">
            <span className="break-words font-bold">{session.className}</span>
            <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-label font-semibold',
              unpaid ? 'border border-warning text-warning' : 'bg-band-tile text-on-signboard')}>{t(unpaid ? messages.unpaid : messages.paid)}</span>
          </span>
          <span className="text-label tabular-nums text-on-surface-variant">{session.startTime}-{session.endTime} · {t(messages.slot, { count: booking.quantity })}</span>
          <span className="truncate text-label text-on-surface-variant">{session.cancelled ? t(messages.cancelledSession) : booking.participants.join(', ')}</span>
        </span>
      </Link>
      {unpaid && (
        <div className="flex items-center gap-2.5 bg-warning-container px-4 py-2.5">
          <span className="flex flex-1 items-center gap-2 font-semibold text-warning">
            <Clock3 aria-hidden="true" className="size-5" />
            <span className="tabular-nums">{t(messages.due, { time: deadlineLabel(booking.originalDeadline, now, language) })}</span>
          </span>
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" aria-label={t(messages.chatAdmin)}
              className="state-layer pressable flex size-11 items-center justify-center rounded-sm border border-outline-variant bg-surface-container-lowest">
              <MessageCircle aria-hidden="true" className="size-5" />
            </a>
          )}
          <Button asChild variant="filled" className="min-h-11 px-4"><Link to={`/bookings/${booking.id}`} viewTransition>{t(messages.howToPay)}</Link></Button>
        </div>
      )}
    </article>
  )
}

function HistoryRow({ booking }: { booking: CustomerBookingItem }) {
  const { t } = useI18n()
  const { session } = booking
  const lapsed = booking.status === 'expired'
  return (
    <Link to={`/bookings/${booking.id}`} viewTransition className="state-layer flex items-center gap-3 py-3">
      <DateTile date={session.date} muted />
      <span className="flex min-w-0 flex-1 flex-col leading-snug">
        <span className={cn('break-words font-semibold', lapsed && 'text-on-surface-variant')}>{session.className}</span>
        <span className="text-label tabular-nums text-on-surface-variant">
          {session.startTime} · {t(messages.slot, { count: booking.quantity })}{lapsed ? ` · ${t(messages.lapsed)}` : session.cancelled ? ` · ${t(messages.cancelledSession)}` : ''}
        </span>
      </span>
      {!lapsed && <span className="shrink-0 text-label font-semibold text-primary">{t(messages.done)}</span>}
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-on-surface-variant" />
    </Link>
  )
}

// History in months, newest first.
function byMonth(items: CustomerBookingItem[], language: Language) {
  const groups: { label: string; items: CustomerBookingItem[] }[] = []
  for (const item of items) {
    const label = new Date(item.session.startsAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
    const last = groups[groups.length - 1]
    if (last?.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}

export function Component() {
  const { language, t } = useI18n()
  const [params, setParams] = useSearchParams()
  const view: CustomerBookingView = params.get('view') === 'history' ? 'history' : 'upcoming'
  const { loaded, loadMore, loadingMore, retry } = useCustomerBookings(view)
  const localNow = useNow(30_000)
  const now = loaded.status === 'ready' ? serverClock(loaded.serverNow, loaded.receivedAt, localNow) : localNow
  const items = loaded.status === 'ready' ? loaded.items : []
  // Upcoming bookings whose deadline passed while the screen was open move out of the active list.
  const shown = view === 'upcoming' ? items.filter(item => item.status !== 'awaiting_payment' || Date.parse(item.originalDeadline) > now) : items

  return <>
    <CourtBand title={t(messages.heading)}>
      {loaded.status !== 'signedOut' && (
        <nav aria-label={t(messages.tabs)} className="mb-4 grid grid-cols-2 gap-1 rounded-sm bg-band-tile p-1">
          {(['upcoming', 'history'] as const).map(value => (
            <Link key={value} to={value === 'history' ? '/bookings?view=history' : '/bookings'} replace aria-current={view === value ? 'page' : undefined}
              onClick={event => { event.preventDefault(); setParams(value === 'history' ? { view: 'history' } : {}, { replace: true }) }}
              className={cn('pressable flex min-h-11 items-center justify-center gap-2 rounded-xs text-label font-semibold',
                view === value ? 'bg-surface-container-lowest text-on-surface' : 'text-on-signboard')}>
              {t(value === 'history' ? messages.history : messages.active)}
              {value === 'upcoming' && view === 'upcoming' && shown.length > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-band-tile px-1.5 text-on-signboard tabular-nums">{shown.length}</span>
              )}
            </Link>
          ))}
        </nav>
      )}
    </CourtBand>
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-3 py-4">
      {loaded.status === 'loading' ? (
        <div className="flex flex-col gap-3"><p role="status" className="sr-only">{t(messages.loading)}</p>
          {[0, 1].map(key => <div key={key} aria-hidden="true" className="h-28 rounded-sm bg-surface-container" />)}</div>
      ) : loaded.status === 'signedOut' ? (
        <section className="flex flex-col items-start gap-3 rounded-sm bg-surface-container-lowest p-5">
          <h2 className="text-title font-bold">{t(messages.signInTitle)}</h2>
          <p className="text-on-surface-variant">{t(messages.signInBody)}</p>
          <Button asChild variant="filled"><Link to={`/customer/sign-in?returnTo=${encodeURIComponent('/bookings')}`}>{t(messages.signIn)}</Link></Button>
        </section>
      ) : loaded.status !== 'ready' ? (
        <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: retry }} />
      ) : shown.length === 0 ? (
        <section className="flex flex-col items-start gap-3 rounded-sm bg-surface-container-lowest p-5">
          <p>{t(view === 'history' ? messages.emptyHistory : messages.emptyActive)}</p>
          {view === 'upcoming' && <Button asChild variant="filled"><Link to="/">{t(messages.findSession)}</Link></Button>}
        </section>
      ) : view === 'upcoming' ? (
        <ul className="flex flex-col gap-3">{shown.map(booking => <li key={booking.id}><ActiveCard booking={booking} now={now} /></li>)}</ul>
      ) : <>
        {byMonth(shown, language).map(group => (
          <section key={group.label} className="flex flex-col gap-2">
            <h2 className="text-label font-semibold text-on-surface-variant">{group.label}</h2>
            <ul className="divide-y divide-outline-variant rounded-sm bg-surface-container-lowest px-4">
              {group.items.map(booking => <li key={booking.id}><HistoryRow booking={booking} /></li>)}
            </ul>
          </section>
        ))}
        {loaded.nextCursor && <Button variant="outlined" onClick={() => void loadMore()} pendingLabel={loadingMore ? t(messages.loading) : undefined}>{t(messages.more)}</Button>}
      </>}
    </div>
  </>
}
