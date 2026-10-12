import { ErrorPage } from '@/features/errors/ErrorPage'
import type { ReactNode } from 'react'
import { ChevronLeft, ExternalLink, MessageCircle } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatClubTime, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { clubDateOf } from '@shared/club-time'
import { venueMapsHref } from '@shared/maps'
import { clubContent } from '@/features/public/club/club-content'
import { useNow } from '@/features/public/schedule/use-now'
import { myBookingsMessages as messages } from './my-bookings.messages'
import { serverClock, useCustomerBooking } from './use-customer-bookings'
import { ConnectionBanner } from '@/components/ui/connection-banner'
import { Button } from '@/components/ui/button'
import { effectiveBookingStatus } from '@shared/booking-rules'
import { useMediaQuery } from '@/lib/use-media-query'
import { ResultScreen } from '../feedback/ResultScreen'
import { rejectionReasonMessages } from '../payments/payments.messages'
import { PhotoMosaicLink } from '@/features/photos/SessionPhotoLinks'

function Band({ title, children }: { title: string; children?: ReactNode }) {
  const { t } = useI18n()
  return <>
    <header className="rounded-b-lg bg-band pb-5 pt-[env(safe-area-inset-top)] text-on-signboard [view-transition-name:app-bar] [&_:focus-visible]:outline-white">
      <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-2">
        <Link to="/bookings" viewTransition data-nav="pop" className="pressable -ml-1 mt-2 flex min-h-12 items-center gap-3 self-start rounded-full pr-3 text-label">
          <span className="flex size-12 items-center justify-center rounded-full bg-band-tile"><ChevronLeft aria-hidden="true" className="size-6" /></span>
          {t(messages.back)}
        </Link>
        <h1 className="break-words text-headline font-bold leading-tight">{title}</h1>
        {children}
      </div>
    </header>
    <ConnectionBanner voice="member" className="page-gutter mx-auto w-full max-w-[50rem]" />
  </>
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-label text-on-surface-variant">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}

export function Component() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const { loaded, retry } = useCustomerBooking(id)
  const localNow = useNow(1_000)
  // Phones and tablets turn the outcome into a result screen (boards 9h-9j); desktop keeps the quiet panel.
  const isDesktop = useMediaQuery('(min-width: 64rem)')

  // A booking that does not exist or is not yours, or no sign-in: the whole page cannot be shown (G1, error page).
  if (loaded.status === 'missing') return <ErrorPage code={404} fill={false} />
  if (loaded.status === 'signedOut') return <ErrorPage code={401} fill={false} />
  if (loaded.status !== 'ready') {
    return <>
      <Band title={t(messages.heading)} />
      <div className="page-gutter mx-auto w-full max-w-[50rem] py-4">
        {loaded.status === 'loading' ? <p role="status" className="appear-late">{t(messages.loading)}</p>
          : <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: retry }} />}
      </div>
    </>
  }

  const { booking } = loaded
  const { session } = booking
  const now = serverClock(loaded.serverNow, loaded.receivedAt, localNow)
  const deadline = Date.parse(booking.originalDeadline)
  // Past the deadline the booking is over even if the response said otherwise a moment ago.
  // A cancelled session outranks the hold: no countdown, no payment, one notice (G1: one feedback per state). The
  // booking keeps its own status (a paid booking still reads Lunas).
  const bookingStatus = effectiveBookingStatus(booking.status, new Date(deadline), new Date(now))
  const status = session.cancelled && bookingStatus !== 'confirmed' ? 'cancelled' as const : bookingStatus
  // Still something to pay or fix before the deadline.
  const owes = status === 'awaiting_payment' || status === 'needs_correction'
  const left = Math.max(0, deadline - now)
  const hours = Math.floor(left / 3_600_000)
  const minutes = Math.floor((left % 3_600_000) / 60_000)
  const deadlineDate = clubDateOf(new Date(deadline))
  const when = `${formatClubDateShort(deadlineDate, language)}, ${formatClubTime(booking.originalDeadline)}`
  const whatsapp = clubContent.whatsapp ? `https://wa.me/${clubContent.whatsapp}` : null
  const cell = 'flex size-16 items-center justify-center rounded-xs bg-band text-headline font-bold tabular-nums'

  const back = { to: '/bookings', label: t(messages.back) }
  const sessionLine = <>
    <p className="font-semibold">{session.className}</p>
    <p className="tabular-nums">{t(messages.sessionLine, { date: formatClubDateShort(session.date, language), time: session.startTime, count: booking.quantity })}</p>
  </>
  const primary = 'state-layer pressable flex min-h-14 items-center justify-center gap-2 rounded-sm bg-cta font-semibold text-on-cta'
  const secondary = 'state-layer pressable flex min-h-13 items-center justify-center gap-2 rounded-sm border border-outline-variant font-semibold'
  const chat = (label: string, className: string) => whatsapp && (
    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={className}><MessageCircle aria-hidden="true" className="size-5" />{label}</a>
  )
  if (!isDesktop && session.cancelled) {
    const paid = bookingStatus === 'confirmed'
    return <ResultScreen kind="rain" aboveDock back={back} session={sessionLine} heading={t(messages.cancelledHeading)} message={t(messages.cancelledMessage)}
      pill={paid ? t(messages.moneySafe, { amount: formatIdr(booking.totalPriceIdr, language) }) : t(messages.cancelledUnpaid)}
      hint={paid && whatsapp ? t(messages.refundHint) : undefined}
      actions={<>
        {paid && chat(t(messages.replyAdmin), primary)}
        <Link to="/schedule" viewTransition data-nav="tab" className={paid && whatsapp ? secondary : primary}>{t(messages.otherSessions)}</Link>
      </>} />
  }
  if (!isDesktop && status === 'needs_correction' && loaded.rejection) {
    const { reason, note } = loaded.rejection
    return <ResultScreen kind="let" aboveDock back={back} session={sessionLine} heading={t(messages.rejectedHeading)}
      message={note || t(rejectionReasonMessages[reason])}
      pill={t(messages.resendBefore, { when, left: `${hours}:${String(minutes).padStart(2, '0')}` })}
      actions={<>
        <Link to={`/bookings/${booking.id}/pay`} viewTransition data-nav="push" className={primary}>{t(messages.resend)}</Link>
        {chat(t(messages.askAdmin), secondary)}
      </>} />
  }
  if (!isDesktop && status === 'expired') {
    const canBookAgain = Date.parse(session.startsAt) > now
    return <ResultScreen kind="out" aboveDock back={back} session={sessionLine} heading={t(messages.lapsedHeading)} message={t(messages.lapsedMessage, { when })}
      actions={<>
        {canBookAgain && <Link to={`/book/${session.id}`} viewTransition data-nav="push" className={primary}>{t(messages.bookAgain)}</Link>}
        {chat(t(messages.paidChat), canBookAgain ? secondary : primary)}
        {!canBookAgain && !whatsapp && <Link to="/schedule" viewTransition data-nav="tab" className={primary}>{t(messages.otherSessions)}</Link>}
      </>} />
  }

  return <>
    <Band title={session.className}>
      <p className="tabular-nums">{formatClubDateShort(session.date, language)} · {session.startTime}-{session.endTime} WIB</p>
      {owes && (
        <section aria-label={t(messages.timeLeft)} className="mt-2 flex flex-col items-center gap-2 rounded-sm bg-band-tile p-4">
          <span className="text-label font-semibold">{t(messages.timeLeft)}</span>
          <div role="timer" aria-label={t(messages.timeLeftLabel, { hours, minutes })} className="flex items-center gap-2">
            <span className={cell}>{String(hours).padStart(2, '0')}</span>
            <span aria-hidden="true" className="text-headline font-bold">:</span>
            <span className={cell}>{String(minutes).padStart(2, '0')}</span>
          </div>
          <span className="text-center text-label">{t(messages.deadline, { when })}</span>
        </section>
      )}
    </Band>
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-3 py-4">
      {session.cancelled && <StatusPanel tone="info" title={t(messages.cancelledSession)}><p>{t(messages.cancelledBody)}</p></StatusPanel>}
      {status === 'expired' && (
        <StatusPanel tone="info" title={t(messages.lapsedTitle)}><p>{t(messages.lapsedBody, { when })}</p></StatusPanel>
      )}
      {owes && (
        <section aria-labelledby="pay" className="flex flex-col gap-2.5 rounded-sm bg-surface-container-lowest p-4">
          <h2 id="pay" className="font-bold">{t(messages.howToPay)}</h2>
          <p className="text-on-surface-variant">{t(status === 'needs_correction' ? messages.correctionNote : messages.payBody)}</p>
          <Button asChild variant="filled" className="min-h-13"><Link to={`/bookings/${booking.id}/pay`} viewTransition data-nav="push">{t(status === 'needs_correction' ? messages.sendNewProof : messages.payNow)}</Link></Button>
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="state-layer pressable flex min-h-12 items-center justify-center gap-2 rounded-sm font-semibold text-primary">
              <MessageCircle aria-hidden="true" className="size-5" />{t(messages.chatAdmin)}
            </a>
          )}
        </section>
      )}
      {status === 'awaiting_verification' && (
        <StatusPanel tone="info" title={t(messages.reviewTitle)} action={{ label: t(messages.seeProof), onAction: () => navigate(`/bookings/${booking.id}/pay`, { viewTransition: true }) }}>
          <p>{t(messages.reviewBody)}</p>
        </StatusPanel>
      )}
      {/* After the session: its album, once the admin has uploaded photos (board 9h). */}
      <PhotoMosaicLink sessionId={session.id} photos={session.photos} className="bg-surface-container-lowest" />
      <section aria-labelledby="players" className="flex flex-col gap-2 rounded-sm bg-surface-container-lowest p-4">
        <h2 id="players" className="flex items-center gap-2 font-bold">{t(messages.players)}
          <span className="rounded-xs bg-primary-container px-2 text-label font-bold text-primary">{t(messages.slot, { count: booking.quantity })}</span>
        </h2>
        <ul className="flex flex-wrap gap-1.5">{booking.participants.map((name, index) => <li key={index} className="rounded-full bg-surface-container px-2.5 py-0.5 text-label">{name}</li>)}</ul>
      </section>
      <dl className="flex flex-col divide-y divide-outline-variant rounded-sm bg-surface-container-lowest px-4">
        <Fact label={t(messages.level)}><span className="font-semibold">{session.levelName}</span></Fact>
        <Fact label={t(messages.venue)}>
          <a href={venueMapsHref(session.venueName, session.venueMapUrl, session.venueAddress)} target="_blank" rel="noopener noreferrer"
            className="-my-1 inline-flex min-h-12 flex-col items-end justify-center">
            <span className="font-semibold">{session.venueName}</span>
            {session.venueAddress && <span className="text-label text-on-surface-variant">{session.venueAddress}</span>}
            <span className="inline-flex items-center gap-1 text-label font-semibold text-primary">{t(messages.openMaps)}<ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={2.25} /></span>
          </a>
        </Fact>
        <Fact label={t(messages.total)}><span className="font-bold tabular-nums">{formatIdr(booking.totalPriceIdr, language)}</span></Fact>
        <Fact label={t(messages.booked)}><span className="tabular-nums">{formatClubDateShort(clubDateOf(new Date(booking.createdAt)), language)}, {formatClubTime(booking.createdAt)} WIB</span></Fact>
      </dl>
      {owes && <p className="text-label text-on-surface-variant">{t(messages.changeNote)}</p>}
    </div>
  </>
}
