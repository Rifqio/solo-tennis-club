import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { Search, X } from 'lucide-react'
import type { AdminBookingFilter } from '@shared/api/admin-bookings'
import { clubDateOf } from '@shared/club-time'
import { Button, IconButton } from '@/components/ui/button'
import { LoadFailed } from '@/components/ui/load-failed'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusPanel } from '@/components/ui/status-panel'
import { BookingsEmpty } from './BookingsEmpty'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatClubTime, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { contentSpring, selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useSettledSearch } from '../forms/use-admin-list'
import { AdminBand } from '../shell/AdminBand'
import { adminBookingsMessages as messages } from './bookings.messages'
import { BookingDetailBody } from './BookingDetailBody'
import { BookingFilters } from './BookingFilters'
import { BOOKING_FILTERS, bookingFacts } from './booking-facts'
import { useAdminBooking } from './use-admin-booking'
import { useAdminBookingList } from './use-admin-booking-list'
import { moreFailedCopy } from './bookings.messages'
import { BookingStatusChip } from './BookingStatusChip'

const copy = {
  search: { id: 'Cari nama atau nomor HP', en: 'Search by name or phone' },
  booker: { id: 'Pemesan', en: 'Booker' },
  slots: { id: 'Slot', en: 'Slots' },
  fromAdmin: { id: 'Dari WA', en: 'From WhatsApp' },
  close: { id: 'Tutup detail', en: 'Close details' },
  noMatch: { id: 'Nggak ada booking yang cocok dengan "{query}".', en: 'No booking matches "{query}".' },
  open: { id: 'Buka booking {name}', en: 'Open booking for {name}' },
}

// The list's query string: the filter (unpaid is the default) and the search.
function urlFor(status: AdminBookingFilter, q: string) {
  const next = new URLSearchParams()
  if (status !== 'unpaid') next.set('status', status)
  if (q.trim()) next.set('q', q.trim())
  const text = next.toString()
  return text ? `?${text}` : ''
}


// Desktop Booking masuk (board D6): the status filter and a name-or-phone search on the band, every booking as a row of
// one table, and the chosen booking in a drawer that opens beside it (the table narrows as it slides in). The drawer
// follows the URL (/admin/bookings/:id), so a booking can be linked and the back button closes it.
export function AdminBookingsDesktop({ openId }: { openId: string | null }) {
  const { language, t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const filter: AdminBookingFilter = BOOKING_FILTERS.includes(params.get('status') as AdminBookingFilter) ? params.get('status') as AdminBookingFilter : 'unpaid'
  // The search lives in the URL too (?q=), so opening a booking (its own route) and closing it keep it.
  const urlSearch = params.get('q') ?? ''
  const [query, setQuery] = useState(urlSearch)
  const search = useSettledSearch(query)
  // A change made in the drawer (a review, a recorded payment) refreshes the table, so the row moves to its new filter.
  const [changes, setChanges] = useState(0)
  const list = useAdminBookingList(filter, search, changes)
  const detail = useAdminBooking(openId)
  const suffix = urlFor(filter, search)
  useEffect(() => {
    if (search.trim() !== urlSearch) navigate(`${location.pathname}${urlFor(filter, search)}`, { replace: true, state: location.state })
  }, [search, urlSearch, filter, navigate, location.pathname, location.state])
  const open = (id: string) => navigate(`/admin/bookings/${id}${suffix}`)
  const close = () => navigate(`/admin/bookings${suffix}`)

  return <>
    <AdminBand title={t(messages.heading)}
      subtitle={<div className="mt-3"><BookingFilters filter={filter} unpaidCount={list.data?.unpaidCount ?? null} reviewCount={list.data?.reviewCount ?? null}
        onChange={value => navigate(`/admin/bookings${openId ? `/${openId}` : ''}${urlFor(value, search)}`, { replace: true })} /></div>}
      action={<label className="flex h-12 w-[21.25rem] max-w-full items-center gap-2.5 rounded-full bg-surface-container-lowest px-4 text-on-surface-variant focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white">
        <Search aria-hidden="true" className="size-5 shrink-0" />
        <span className="sr-only">{t(copy.search)}</span>
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t(copy.search)}
          className="min-w-0 flex-1 bg-transparent text-body text-on-surface outline-none placeholder:text-on-surface-variant" />
      </label>} />
    <div className="desk-column flex items-start py-5">
      <section aria-label={t(messages.heading)} aria-busy={list.searching} className="min-w-0 flex-1 overflow-hidden rounded-lg bg-surface-container-lowest">
        {list.status === 'loading' ? (
          <Skeleton shape="table-row" count={4} label={t(messages.loading)} voice="admin" onRetry={list.retry} className="p-6" />
        ) : list.status === 'error' ? (
          <LoadFailed voice="admin" title={t(messages.error)} onRetry={list.retry} className="p-6" />
        ) : list.items.length === 0 ? (
          search ? <p className="p-6 text-on-surface-variant">{t(copy.noMatch, { query: search })}</p> : <BookingsEmpty filter={filter} />
        ) : <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse">
              <thead>
                <tr className="text-left text-label text-on-surface-variant">
                  <th scope="col" className="py-3 pl-6 pr-3 pt-4 font-semibold">{t(copy.booker)}</th>
                  <th scope="col" className="px-3 py-3 pt-4 font-semibold">{t(messages.session)}</th>
                  <th scope="col" className="px-3 py-3 pt-4 text-right font-semibold">{t(copy.slots)}</th>
                  <th scope="col" className="px-3 py-3 pt-4 text-right font-semibold">{t(messages.total)}</th>
                  <th scope="col" className="px-3 py-3 pt-4 font-semibold">{t(messages.booked)}</th>
                  <th scope="col" className="py-3 pl-3 pr-6 pt-4 font-semibold">{t(messages.status)}</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map(booking => {
                  const on = booking.id === openId
                  return (
                    // The name is the row's button for keyboards and screen readers; a click anywhere on the row opens it too.
                    <tr key={booking.id} onClick={() => open(booking.id)}
                      className={cn('cursor-pointer border-t border-outline-variant transition-colors duration-150', on ? 'bg-primary-container' : 'hover:bg-surface-container-low')}>
                      <td className="relative py-3.5 pl-6 pr-3">
                        {/* The open booking's marker glides to the next row picked; the row tint changes at once. */}
                        {on && <m.span layoutId="booking-row-marker" transition={selectionSpring} aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />}
                        <button type="button" aria-pressed={on} aria-label={t(copy.open, { name: booking.bookerName })} onClick={event => { event.stopPropagation(); open(booking.id) }}
                          className="flex min-h-11 flex-col justify-center text-left">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-bold">{booking.bookerName}</span>
                            {booking.source === 'admin' && <span className="rounded-xs border border-dashed border-outline px-1.5 text-label font-semibold text-on-surface-variant">{t(copy.fromAdmin)}</span>}
                          </span>
                          <span className="text-label tabular-nums text-on-surface-variant">{booking.bookerPhone}</span>
                        </button>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="flex flex-col leading-snug">
                          <span className="font-semibold">{booking.session.className}</span>
                          <span className="text-label tabular-nums text-on-surface-variant">{formatClubDateShort(booking.session.date, language)}, {booking.session.startTime}{booking.session.cancelled ? ` · ${t(messages.cancelledSession)}` : ''}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums">{booking.quantity}</td>
                      <td className="px-3 py-3.5 text-right font-semibold tabular-nums">{formatIdr(booking.totalPriceIdr, language)}</td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-label tabular-nums text-on-surface-variant">{formatClubDateShort(clubDateOf(new Date(booking.createdAt)), language)}, {formatClubTime(booking.createdAt)}</td>
                      <td className="py-3.5 pl-3 pr-6"><BookingStatusChip booking={booking} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {list.moreFailed ? <div className="border-t border-outline-variant p-4"><StatusPanel tone="error" title={t(moreFailedCopy)} action={{ label: t(commonMessages.retry), onAction: () => void list.loadMore() }} /></div> : list.hasMore && <div className="border-t border-outline-variant p-4"><Button variant="outlined" className="w-full" onClick={() => void list.loadMore()} pendingLabel={list.loadingMore ? t(messages.loading) : undefined}>{t(messages.more)}</Button></div>}
          {filter === 'unpaid' && <p className="border-t border-outline-variant px-6 py-4 text-label text-on-surface-variant">{t(messages.footnote)}</p>}
        </>}
      </section>
      {/* The drawer's width opens from 0, so the table eases narrower as it slides in. It opens once: switching bookings
          keeps the last one on screen until the next has loaded, and closing keeps it while the drawer folds away. */}
      <AnimatePresence initial={false}>
        {openId && (
          <m.div key="drawer" initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={contentSpring}
            className="sticky top-5 shrink-0 overflow-hidden">
            <aside aria-label={t(messages.heading)} aria-busy={detail.stale} inert={detail.stale} className="ml-5 w-[26rem] overflow-hidden rounded-lg bg-surface-container-lowest xl:w-[28rem]">
              {detail.held?.kind === 'ok' ? (() => {
                const { booking } = detail.held.data
                const { status, deadline } = bookingFacts(detail.held.data, language)
                return <>
                  <div className="flex flex-col gap-3.5 bg-band p-6 text-on-signboard [&_:focus-visible]:outline-white">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex min-w-0 flex-wrap items-center gap-2.5">
                        <h2 className="break-words text-headline font-bold">{booking.bookerName}</h2>
                        <span className="rounded-xs bg-surface-container-lowest px-2.5 py-0.5 text-label font-bold text-primary">{t(messages.slot, { count: booking.quantity })}</span>
                      </span>
                      <IconButton label={t(copy.close)} onClick={close} className="bg-band-tile text-on-signboard"><X aria-hidden="true" className="size-5" /></IconButton>
                    </div>
                    <dl className="grid grid-cols-2 gap-2">
                      <div className="rounded-sm bg-band-tile px-3 py-2.5"><dt className="text-label">{t(messages.status)}</dt><dd className="text-title font-bold">{t(status)}</dd></div>
                      <div className="rounded-sm bg-band-tile px-3 py-2.5"><dt className="text-label">{t(messages.deadline)}</dt><dd className="text-title font-bold tabular-nums">{deadline}</dd></div>
                    </dl>
                  </div>
                  <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
                    <BookingDetailBody data={detail.held.data} onChanged={next => { detail.replace(next); setChanges(value => value + 1) }} drawer />
                  </div>
                </>
              })() : (
                <div className="flex flex-col gap-3 p-6">
                  <div className="flex justify-end"><IconButton label={t(copy.close)} onClick={close}><X aria-hidden="true" className="size-5" /></IconButton></div>
                  {!detail.response ? <Skeleton shape="detail" count={1} label={t(messages.loading)} voice="admin" onRetry={detail.retry} />
                    : detail.response.kind === 'http' && detail.response.status === 404 ? <StatusPanel tone="info" title={t(messages.missing)} />
                    : <LoadFailed voice="admin" title={t(messages.error)} onRetry={detail.retry} />}
                </div>
              )}
            </aside>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  </>
}
