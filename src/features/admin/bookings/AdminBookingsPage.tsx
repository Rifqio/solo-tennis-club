import { ChevronRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import type { Language, Message } from '@/i18n/types'
import { addClubDays, clubDateOf } from '@shared/club-time'
import type { AdminBookingFilter, AdminBookingSummary } from '@shared/api/admin-bookings'
import { AdminBand } from '../shell/AdminBand'
import { adminBookingsMessages as messages } from './bookings.messages'
import { BookingFilters } from './BookingFilters'
import { BOOKING_FILTERS } from './booking-facts'
import { useAdminBookingList } from './use-admin-booking-list'
import { moreFailedCopy } from './bookings.messages'
import { BookingStatusChip } from './BookingStatusChip'

function BookingRow({ booking, filter }: { booking: AdminBookingSummary; filter: AdminBookingFilter }) {
  const { language, t } = useI18n()
  const { session } = booking
  const chip = <BookingStatusChip booking={booking} />
  return (
    <Link to={`/admin/bookings/${booking.id}`} viewTransition className="state-layer flex items-center gap-3 py-3">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
        <span className="flex flex-wrap items-center gap-2">
          <span className="break-words font-bold">{booking.bookerName}</span>
          <span className="rounded-xs bg-primary-container px-2 text-label font-bold text-primary">{t(messages.slot, { count: booking.quantity })}</span>
          {booking.source === 'admin' && <span className="rounded-xs border border-dashed border-outline px-1.5 text-label font-semibold text-on-surface-variant">{t(messages.fromAdmin)}</span>}
        </span>
        <span className="text-label tabular-nums text-on-surface-variant">
          {session.className} · {formatClubDateShort(session.date, language)}, {session.startTime}{session.cancelled ? ` · ${t(messages.cancelledSession)}` : ''}
        </span>
        {filter !== 'unpaid' && <span className="sr-only">{booking.status}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">{chip}<ChevronRight aria-hidden="true" className="size-5 text-on-surface-variant" /></span>
    </Link>
  )
}

// Unpaid bookings grouped by the day their deadline falls; the other filters by the day they were booked.
function groupBookings(items: AdminBookingSummary[], filter: AdminBookingFilter, today: string, language: Language) {
  const groups: { key: string; title: { message: Message; values?: Record<string, string> }; items: AdminBookingSummary[] }[] = []
  for (const item of items) {
    const day = clubDateOf(new Date(filter === 'unpaid' ? item.originalDeadline : item.createdAt))
    const title = filter !== 'unpaid' ? { message: messages.bookedOn, values: { date: formatClubDateShort(day, language) } }
      : day === today ? { message: messages.dueToday }
      : day === addClubDays(today, 1) ? { message: messages.dueTomorrow }
      : { message: messages.dueOn, values: { date: formatClubDateShort(day, language) } }
    const last = groups[groups.length - 1]
    if (last?.key === day) last.items.push(item)
    else groups.push({ key: day, title, items: [item] })
  }
  return groups
}

// Desktop renders the table and drawer from bookings-route.
export function Component() { return <BookingsScreen /> }

// Phones (board 14): unpaid bookings grouped by deadline day, the others by booking day.
function BookingsScreen() {
  const { language, t } = useI18n()
  const [params, setParams] = useSearchParams()
  const filter: AdminBookingFilter = BOOKING_FILTERS.includes(params.get('status') as AdminBookingFilter) ? params.get('status') as AdminBookingFilter : 'unpaid'
  const list = useAdminBookingList(filter)
  const data = list.data
  const items = list.items
  const today = data ? clubDateOf(new Date(data.serverNow)) : clubDateOf(new Date())
  const empty = filter === 'review' ? messages.emptyReview : filter === 'unpaid' ? messages.emptyUnpaid : filter === 'confirmed' ? messages.emptyConfirmed : messages.emptyAll

  return <>
    <AdminBand title={t(messages.heading)}>
      <BookingFilters filter={filter} unpaidCount={data?.unpaidCount ?? null} reviewCount={data?.reviewCount ?? null} onChange={value => setParams(value === 'unpaid' ? {} : { status: value }, { replace: true })} />
    </AdminBand>
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-4 py-4">
      {list.status === 'loading' ? (
        <div className="flex flex-col gap-2"><p role="status" className="sr-only">{t(messages.loading)}</p>
          {[0, 1].map(key => <div key={key} aria-hidden="true" className="appear-late h-36 rounded-sm bg-surface-container" />)}</div>
      ) : list.status === 'error' || !data ? (
        <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: list.retry }} />
      ) : items.length === 0 ? (
        <p className="rounded-sm bg-surface-container-lowest p-5">{t(empty)}</p>
      ) : <>
        {groupBookings(items, filter, today, language).map(group => (
          <section key={group.key} className="flex flex-col gap-2">
            <h2 className="text-label font-semibold text-on-surface-variant">{t(group.title.message, group.title.values)}</h2>
            <ul className="divide-y divide-outline-variant rounded-sm bg-surface-container-lowest px-4">
              {group.items.map(booking => <li key={booking.id}><BookingRow booking={booking} filter={filter} /></li>)}
            </ul>
          </section>
        ))}
        {list.moreFailed ? <StatusPanel tone="error" title={t(moreFailedCopy)} action={{ label: t(commonMessages.retry), onAction: () => void list.loadMore() }} /> : list.hasMore && <Button variant="outlined" onClick={() => void list.loadMore()} pendingLabel={list.loadingMore ? t(messages.loading) : undefined}>{t(messages.more)}</Button>}
        {filter === 'unpaid' && <p className="text-center text-label text-on-surface-variant">{t(messages.footnote)}</p>}
      </>}
    </div>
  </>
}
