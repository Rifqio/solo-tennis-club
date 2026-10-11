import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusPanel } from '@/components/ui/status-panel'
import { formatClubDateShort, formatClubTime, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { clubDateOf } from '@shared/club-time'
import type { AdminBookingDetailResponse } from '@shared/api/admin-bookings'
import { adminBookingLinkMessages, adminBookingsMessages as messages } from './bookings.messages'
import { BookingLinkSection } from './BookingLinkSection'
import { whatsappHref } from './booking-facts'
import type { CreatedBookingState } from './AdminBookingFormPage'

// Everything under a booking's blue header: contact and chat, linking an admin-recorded booking to an account, the
// players, session, total and when it was booked. `drawer` (desktop, board D6): one white panel with the players as a
// row of the list; phones (board 15) keep separate cards.
export function BookingDetailBody({ data, created, onChanged, drawer = false }: {
  data: AdminBookingDetailResponse; created: CreatedBookingState['created'] | null; onChanged: (detail: AdminBookingDetailResponse) => void; drawer?: boolean
}) {
  const { language, t } = useI18n()
  const { booking } = data
  const { session } = booking
  const phone = booking.customer?.phone ?? booking.bookerPhone
  const href = whatsappHref(phone)
  const linkedAt = booking.linked ? formatClubDateShort(clubDateOf(new Date(booking.linked.at)), language) + ', ' + formatClubTime(booking.linked.at) : null
  const card = drawer ? '' : 'rounded-sm bg-surface-container-lowest'
  const players = <ul className={cn('flex flex-wrap gap-1.5', drawer && 'justify-end')}>{booking.participants.map((name, index) => <li key={index} className="rounded-full bg-surface-container px-2.5 py-0.5 text-label">{name}</li>)}</ul>
  return <>
    {created && (
      <StatusPanel tone="success" title={t(adminBookingLinkMessages.created)}>
        <p>{created.replayed ? t(adminBookingLinkMessages.replayed) : t(adminBookingLinkMessages.createdBody, { time: formatClubTime(created.deadline) })}</p>
      </StatusPanel>
    )}
    <section aria-label={t(booking.customer ? messages.phoneVerified : messages.phoneRecorded)} className={cn('flex items-center justify-between gap-3', !drawer && 'px-4 py-3.5', card)}>
      <span className="flex min-w-0 flex-col leading-snug">
        <span className="text-label text-on-surface-variant">{t(booking.customer ? messages.phoneVerified : messages.phoneRecorded)}</span>
        <span className="break-all font-bold tabular-nums">{phone}</span>
        {booking.linked && linkedAt && (
          <span className="text-label text-on-surface-variant">{t(adminBookingLinkMessages.linkedAt, { date: linkedAt, by: booking.linked.by ? t(adminBookingLinkMessages.linkedBy, { name: booking.linked.by }) : '' })}</span>
        )}
      </span>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={t(messages.chatLabel, { name: booking.bookerName })}
          className="pressable flex min-h-12 shrink-0 items-center gap-2 rounded-sm bg-band-tile px-4 font-semibold text-on-signboard">
          <MessageCircle aria-hidden="true" className="size-5" />{t(messages.chat)}
        </a>
      )}
    </section>
    {!booking.customer && <BookingLinkSection booking={booking} onChanged={onChanged} />}
    {!drawer && <section aria-labelledby="players" className={cn('flex flex-col gap-2 p-4', card)}>
      <h2 id="players" className="font-bold">{t(messages.players)}</h2>
      {players}
    </section>}
    <dl className={cn('flex flex-col divide-y divide-outline-variant', drawer ? 'border-t border-outline-variant' : 'px-4', card)}>
      {drawer && <div className="flex items-start justify-between gap-4 py-3"><dt className="text-label text-on-surface-variant">{t(messages.players)}</dt><dd>{players}</dd></div>}
      <div className="flex justify-between gap-4 py-3">
        <dt className="text-label text-on-surface-variant">{t(messages.session)}</dt>
        <dd className="flex flex-col items-end text-right">
          <Link to={`/admin/sessions/${session.id}/roster`} viewTransition className="inline-flex min-h-12 items-center font-semibold text-primary">{session.className}</Link>
          <span className="text-label tabular-nums text-on-surface-variant">{formatClubDateShort(session.date, language)}, {session.startTime}-{session.endTime}</span>
        </dd>
      </div>
      <div className="flex justify-between gap-4 py-3"><dt className="text-label text-on-surface-variant">{t(messages.total)}</dt><dd className="font-bold tabular-nums">{formatIdr(booking.totalPriceIdr, language)}</dd></div>
      <div className="flex justify-between gap-4 py-3">
        <dt className="text-label text-on-surface-variant">{t(messages.booked)}</dt>
        <dd className="text-right tabular-nums">{formatClubDateShort(clubDateOf(new Date(booking.createdAt)), language)}, {formatClubTime(booking.createdAt)} · {t(booking.source === 'admin' ? messages.viaAdmin : messages.viaApp)}</dd>
      </div>
    </dl>
    {booking.status === 'awaiting_payment' && <p className="rounded-sm bg-surface-container px-3.5 py-3 text-label">{t(messages.paymentLater)}</p>}
  </>
}
