import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatClubTime } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import type { Language, Message } from '@/i18n/types'
import { cn } from '@/lib/utils'
import type { AdminResult } from '@/lib/admin-api'
import { addClubDays, clubDateOf } from '@shared/club-time'
import type { AdminBookingFilter, AdminBookingListResponse, AdminBookingSummary } from '@shared/api/admin-bookings'
import { useAdminAuth } from '../auth/use-admin-auth'
import { AdminBand } from '../shell/AdminBand'
import { adminBookingsMessages as messages } from './bookings.messages'

const FILTERS: AdminBookingFilter[] = ['unpaid', 'confirmed', 'all']

function BookingRow({ booking, filter }: { booking: AdminBookingSummary; filter: AdminBookingFilter }) {
  const { language, t } = useI18n()
  const { session } = booking
  const chip = booking.status === 'awaiting_payment'
    ? <span className="rounded-full bg-warning-container px-2.5 py-0.5 text-label font-bold tabular-nums text-warning">{t(messages.due, { time: formatClubTime(booking.originalDeadline) })}</span>
    : booking.status === 'confirmed'
      ? <span className="rounded-full bg-band-tile px-2.5 py-0.5 text-label font-semibold text-on-signboard">{t(messages.confirmed)}</span>
      : <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-label font-semibold text-on-surface-variant">{t(messages.expired)}</span>
  return (
    <Link to={`/admin/bookings/${booking.id}`} viewTransition className="state-layer flex items-center gap-3 py-3">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
        <span className="flex flex-wrap items-center gap-2">
          <span className="break-words font-bold">{booking.bookerName}</span>
          <span className="rounded-xs bg-secondary-container px-2 text-label font-bold text-on-secondary-container">{t(messages.slot, { count: booking.quantity })}</span>
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

export function Component() {
  const { get, state: auth } = useAdminAuth()
  const { language, t } = useI18n()
  const [params, setParams] = useSearchParams()
  const filter: AdminBookingFilter = FILTERS.includes(params.get('status') as AdminBookingFilter) ? params.get('status') as AdminBookingFilter : 'unpaid'
  const [result, setResult] = useState<{ filter: AdminBookingFilter; response: AdminResult<AdminBookingListResponse> } | null>(null)
  const [more, setMore] = useState<{ filter: AdminBookingFilter; items: AdminBookingSummary[]; nextCursor: string | null } | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (auth.status !== 'signedIn') return
    const controller = new AbortController()
    void get<AdminBookingListResponse>(`/api/admin/bookings?status=${filter}`, controller.signal).then(response => {
      if (!controller.signal.aborted) { setResult({ filter, response }); setMore(null) }
    })
    return () => controller.abort()
  }, [get, filter, attempt, auth.status])
  const response = result?.filter === filter ? result.response : null
  const data = response?.kind === 'ok' ? response.data : null
  const extra = more?.filter === filter ? more : null
  const items = [...(data?.items ?? []), ...(extra?.items ?? [])]
  const nextCursor = extra ? extra.nextCursor : data?.nextCursor ?? null
  const today = data ? clubDateOf(new Date(data.serverNow)) : clubDateOf(new Date())
  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const page = await get<AdminBookingListResponse>(`/api/admin/bookings?status=${filter}&cursor=${encodeURIComponent(nextCursor)}`)
      if (page.kind === 'ok') setMore({ filter, items: [...(extra?.items ?? []), ...page.data.items], nextCursor: page.data.nextCursor })
    } finally { setLoadingMore(false) }
  }
  const empty = filter === 'unpaid' ? messages.emptyUnpaid : filter === 'confirmed' ? messages.emptyConfirmed : messages.emptyAll

  return <>
    <AdminBand title={t(messages.heading)}>
      <div role="group" aria-label={t(messages.filter)} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map(value => {
          const on = value === filter
          return (
            <button key={value} type="button" aria-pressed={on} onClick={() => setParams(value === 'unpaid' ? {} : { status: value }, { replace: true })}
              className={cn('state-layer pressable flex min-h-12 shrink-0 items-center gap-2 rounded-full px-3.5 text-label font-semibold',
                on ? 'bg-surface-container-lowest text-on-surface' : 'bg-band-tile text-on-signboard')}>
              {t(messages[value])}
              {value === 'unpaid' && data && data.unpaidCount > 0 && (
                <span className="-mr-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-warning-container px-2 font-bold tabular-nums text-warning">{data.unpaidCount}</span>
              )}
            </button>
          )
        })}
      </div>
    </AdminBand>
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-4 py-4">
      {!response ? (
        <div className="flex flex-col gap-2"><p role="status" className="sr-only">{t(messages.loading)}</p>
          {[0, 1].map(key => <div key={key} aria-hidden="true" className="h-36 rounded-sm bg-surface-container" />)}</div>
      ) : !data ? (
        <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: () => { setResult(null); setAttempt(value => value + 1) } }} />
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
        {nextCursor && <Button variant="outlined" onClick={() => void loadMore()} pendingLabel={loadingMore ? t(messages.loading) : undefined}>{t(messages.more)}</Button>}
        {filter === 'unpaid' && <p className="text-center text-label text-on-surface-variant">{t(messages.footnote)}</p>}
      </>}
    </div>
  </>
}
