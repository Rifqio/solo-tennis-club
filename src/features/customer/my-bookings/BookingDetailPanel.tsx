import { ExternalLink, MessageCircle } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatClubTime, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { clubDateOf } from '@shared/club-time'
import { venueMapsHref } from '@shared/maps'
import { clubContent } from '@/features/public/club/club-content'
import { useNow } from '@/features/public/schedule/use-now'
import { myBookingsMessages as messages } from './my-bookings.messages'
import { serverClock, useCustomerBooking } from './use-customer-bookings'
import { panelEnter } from '@/lib/motion'
import { Link, useNavigate } from 'react-router-dom'
import { setNavMotion } from '@/lib/nav-motion'
import { memberStatus, memberStatusLabel } from './member-status'
import { effectiveBookingStatus } from '@shared/booking-rules'

// Desktop: the chosen booking beside the list, one question per block: what, when to pay, who and where.
export function BookingDetailPanel({ id }: { id: string }) {
  const { language, t } = useI18n()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const { loaded: current, previous, retry } = useCustomerBooking(id)
  // While the next booking loads, the previous one stays in place instead of flashing a loading state.
  const loaded = current.status === 'loading' && previous?.status === 'ready' ? previous : current
  const localNow = useNow(30_000)
  const frame = 'sticky top-5 flex w-full flex-col gap-5 rounded-lg bg-surface-container-lowest p-6'

  if (loaded.status !== 'ready') {
    return (
      <m.aside aria-label={t(messages.heading)} {...panelEnter(reduceMotion)} className={frame}>
        {loaded.status === 'loading' ? <div aria-hidden="true" className="appear-late flex flex-col gap-3">
          <div className="h-6 w-24 rounded-full bg-surface-container-high" /><div className="h-8 w-2/3 rounded-xs bg-surface-container-high" /><div className="h-24 rounded-md bg-surface-container" />
        </div>
          : loaded.status === 'missing' ? <StatusPanel tone="info" title={t(messages.missing)} />
          : loaded.status === 'signedOut' ? <StatusPanel tone="info" title={t(messages.signInTitle)} action={{ label: t(messages.signIn), onAction: () => { setNavMotion('push'); navigate(`/customer/sign-in?returnTo=${encodeURIComponent('/bookings')}`, { viewTransition: true }) } }} />
          : <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: retry }} />}
      </m.aside>
    )
  }

  const { booking } = loaded
  const { session } = booking
  const now = serverClock(loaded.serverNow, loaded.receivedAt, localNow)
  const deadline = Date.parse(booking.originalDeadline)
  // A cancelled session outranks the hold: no countdown, no payment, one notice (G1: one feedback per state). The
  // booking keeps its own status (a paid booking still reads Lunas).
  const bookingStatus = effectiveBookingStatus(booking.status, new Date(deadline), new Date(now))
  const status = session.cancelled && bookingStatus !== 'confirmed' ? 'cancelled' as const : bookingStatus
  const unpaid = status === 'awaiting_payment' || status === 'needs_correction'
  const left = Math.max(0, deadline - now)
  const hours = Math.floor(left / 3_600_000)
  const minutes = Math.floor((left % 3_600_000) / 60_000)
  const when = `${formatClubDateShort(clubDateOf(new Date(deadline)), language)}, ${formatClubTime(booking.originalDeadline)}`
  const whatsapp = clubContent.whatsapp ? `https://wa.me/${clubContent.whatsapp}` : null
  const chip = status === 'cancelled' ? messages.cancelledSession : memberStatusLabel[memberStatus(booking.status, booking.originalDeadline, now)]

  return (
    <m.aside aria-label={t(messages.heading)} {...panelEnter(reduceMotion)} className={frame}>
      <div className="flex flex-col gap-1.5">
        <span className={cn('self-start rounded-full px-3 py-0.5 text-label font-semibold',
          unpaid ? 'bg-warning-container text-warning' : status === 'expired' || status === 'cancelled' ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary-container text-primary')}>{t(chip)}</span>
        <h2 className="break-words text-headline font-bold">{session.className}</h2>
        <p className="tabular-nums text-on-surface-variant">{formatClubDateShort(session.date, language)} · {session.startTime}-{session.endTime} WIB</p>
      </div>

      {session.cancelled && <StatusPanel tone="info" title={t(messages.cancelledSession)}><p>{t(messages.cancelledBody)}</p></StatusPanel>}
      {status === 'expired' && <StatusPanel tone="info" title={t(messages.lapsedTitle)}><p>{t(messages.lapsedBody, { when })}</p></StatusPanel>}
      {status === 'awaiting_verification' && <StatusPanel tone="info" title={t(messages.reviewTitle)}><p>{t(messages.reviewBody)}</p></StatusPanel>}
      {unpaid && (
        <section aria-label={t(messages.timeLeft)} className="flex flex-col gap-3.5 rounded-md bg-primary p-5 text-on-primary">
          <span className="flex flex-col leading-tight">
            <span className="text-label">{t(messages.timeLeft)}</span>
            <span role="timer" aria-label={t(messages.timeLeftLabel, { hours, minutes })} className="text-display font-bold tabular-nums">{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}</span>
            <span className="text-label">{t(messages.deadline, { when })}</span>
          </span>
          <p className="text-label">{t(status === 'needs_correction' ? messages.correctionNote : messages.payBody)}</p>
          <Link to={`/bookings/${booking.id}/pay`} viewTransition data-nav="push" className="state-layer pressable flex min-h-13 items-center justify-center gap-2 rounded-sm bg-cta font-semibold text-on-cta">
            {t(status === 'needs_correction' ? messages.sendNewProof : messages.payNow)}
          </Link>
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="state-layer pressable flex min-h-12 items-center justify-center gap-2 rounded-sm font-semibold text-on-primary underline-offset-4 hover:underline">
              <MessageCircle aria-hidden="true" className="size-5" />{t(messages.chatAdmin)}
            </a>
          )}
        </section>
      )}

      <dl className="flex flex-col">
        <div className="flex items-center justify-between gap-4 border-t border-outline-variant py-3">
          <dt className="text-on-surface-variant">{t(messages.slot, { count: booking.quantity })}</dt>
          <dd className="flex flex-wrap justify-end gap-1.5">{booking.participants.map((name, index) => <span key={index} className="rounded-full bg-surface-container px-2.5 py-0.5 text-label">{name}</span>)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-outline-variant py-3">
          <dt className="text-on-surface-variant">{t(messages.venue)}</dt>
          <dd>
            <a href={venueMapsHref(session.venueName, session.venueMapUrl, session.venueAddress)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 flex-col items-end justify-center">
              <span className="font-semibold">{session.venueName}</span>
              <span className="inline-flex items-center gap-1 text-label font-semibold text-primary">{t(messages.openMaps)}<ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={2.25} /></span>
            </a>
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-outline-variant py-3">
          <dt className="text-on-surface-variant">{t(messages.total)}</dt>
          <dd className="font-bold tabular-nums">{formatIdr(booking.totalPriceIdr, language)}</dd>
        </div>
      </dl>
      {unpaid && <p className="text-label text-on-surface-variant">{t(messages.changeNote)}</p>}
      <Link to={`/bookings/${booking.id}`} viewTransition data-nav="push" className="self-start text-label font-semibold text-primary underline-offset-4 hover:underline">{t(messages.openDetail)}</Link>
    </m.aside>
  )
}
