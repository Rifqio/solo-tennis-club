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
import { setNavMotion } from '@/lib/nav-motion'

function Band({ title, children }: { title: string; children?: ReactNode }) {
  const { t } = useI18n()
  return (
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
  )
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

  if (loaded.status !== 'ready') {
    return <>
      <Band title={t(messages.heading)} />
      <div className="page-gutter mx-auto w-full max-w-[50rem] py-4">
        {loaded.status === 'loading' ? <p role="status">{t(messages.loading)}</p>
          : loaded.status === 'missing' ? <StatusPanel tone="info" title={t(messages.missing)} />
          : loaded.status === 'signedOut' ? <StatusPanel tone="info" title={t(messages.signInTitle)} action={{ label: t(messages.signIn), onAction: () => { setNavMotion('push'); navigate(`/customer/sign-in?returnTo=${encodeURIComponent(`/bookings/${id}`)}`, { viewTransition: true }) } }} />
          : <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: retry }} />}
      </div>
    </>
  }

  const { booking } = loaded
  const { session } = booking
  const now = serverClock(loaded.serverNow, loaded.receivedAt, localNow)
  const deadline = Date.parse(booking.originalDeadline)
  // Past the deadline the booking is over even if the response said otherwise a moment ago.
  const status = booking.status === 'awaiting_payment' && deadline <= now ? 'expired' : booking.status
  const left = Math.max(0, deadline - now)
  const hours = Math.floor(left / 3_600_000)
  const minutes = Math.floor((left % 3_600_000) / 60_000)
  const deadlineDate = clubDateOf(new Date(deadline))
  const when = `${formatClubDateShort(deadlineDate, language)}, ${formatClubTime(booking.originalDeadline)}`
  const whatsapp = clubContent.whatsapp ? `https://wa.me/${clubContent.whatsapp}` : null
  const cell = 'flex size-16 items-center justify-center rounded-xs bg-band text-headline font-bold tabular-nums'

  return <>
    <Band title={session.className}>
      <p className="tabular-nums">{formatClubDateShort(session.date, language)} · {session.startTime}-{session.endTime} WIB</p>
      {status === 'awaiting_payment' && (
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
      {session.cancelled && <StatusPanel tone="info" title={t(messages.cancelledSession)} />}
      {status === 'expired' && (
        <StatusPanel tone="info" title={t(messages.lapsedTitle)}><p>{t(messages.lapsedBody, { when })}</p></StatusPanel>
      )}
      {status === 'awaiting_payment' && (
        <section aria-labelledby="pay" className="flex flex-col gap-2.5 rounded-sm bg-surface-container-lowest p-4">
          <h2 id="pay" className="font-bold">{t(messages.howToPay)}</h2>
          <p className="text-on-surface-variant">{t(whatsapp ? messages.payBody : messages.payBodyNoContact)}</p>
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="pressable flex min-h-12 items-center justify-center gap-2 rounded-sm bg-band font-semibold text-on-signboard">
              <MessageCircle aria-hidden="true" className="size-5" />{t(messages.chatAdmin)}
            </a>
          )}
        </section>
      )}
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
      {status === 'awaiting_payment' && <p className="text-label text-on-surface-variant">{t(messages.changeNote)}</p>}
    </div>
  </>
}
