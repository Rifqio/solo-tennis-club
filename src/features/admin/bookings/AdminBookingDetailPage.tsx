import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatClubTime, formatClubWeekdayShort, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import type { AdminResult } from '@/lib/admin-api'
import { clubDateOf } from '@shared/club-time'
import type { AdminBookingDetailResponse } from '@shared/api/admin-bookings'
import { useAdminAuth } from '../auth/use-admin-auth'
import { AdminBand } from '../shell/AdminBand'
import { adminBookingsMessages as messages } from './bookings.messages'

// wa.me takes the number as digits with the country code.
function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits.startsWith('0') ? '62' + digits.slice(1) : digits}` : null
}

export function Component() {
  const { id = '' } = useParams()
  const { get, state: auth } = useAdminAuth()
  const { language, t } = useI18n()
  const [result, setResult] = useState<{ id: string; response: AdminResult<AdminBookingDetailResponse> } | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (auth.status !== 'signedIn') return
    const controller = new AbortController()
    void get<AdminBookingDetailResponse>(`/api/admin/bookings/${encodeURIComponent(id)}`, controller.signal).then(response => {
      if (!controller.signal.aborted) setResult({ id, response })
    })
    return () => controller.abort()
  }, [get, id, attempt, auth.status])
  const response = result?.id === id ? result.response : null
  const back = { to: '/admin/bookings', label: t(messages.back) }

  if (response?.kind !== 'ok') {
    return <>
      <AdminBand title={t(messages.heading)} back={back} />
      <div className="page-gutter mx-auto w-full max-w-[50rem] py-4">
        {!response ? <p role="status">{t(messages.loading)}</p>
          : response.kind === 'http' && response.status === 404 ? <StatusPanel tone="info" title={t(messages.missing)} />
          : <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: () => { setResult(null); setAttempt(value => value + 1) } }} />}
      </div>
    </>
  }

  const { booking } = response.data
  const { session } = booking
  const deadlineDate = clubDateOf(new Date(booking.originalDeadline))
  const deadline = `${deadlineDate === clubDateOf(new Date(response.data.serverNow)) ? '' : formatClubWeekdayShort(deadlineDate, language) + ' '}${formatClubTime(booking.originalDeadline)}`
  const status = booking.status === 'awaiting_payment' ? messages.unpaid : booking.status === 'confirmed' ? messages.confirmed : messages.expired
  const phone = booking.customer?.phone ?? booking.bookerPhone
  const href = whatsappHref(phone)
  const tile = 'rounded-sm bg-band-tile px-3 py-2.5'

  return <>
    <AdminBand title={booking.bookerName} back={back}
      action={<span className="shrink-0 rounded-xs bg-surface-container-lowest px-2.5 py-0.5 text-label font-bold text-primary">{t(messages.slot, { count: booking.quantity })}</span>}>
      <dl className="grid grid-cols-2 gap-2">
        <div className={tile}><dt className="text-label">{t(messages.status)}</dt><dd className="text-title font-bold">{t(status)}</dd></div>
        <div className={tile}><dt className="text-label">{t(messages.deadline)}</dt><dd className="text-title font-bold tabular-nums">{deadline}</dd></div>
      </dl>
    </AdminBand>
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-3 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <section aria-label={t(booking.customer ? messages.phoneVerified : messages.phoneRecorded)} className="flex items-center justify-between gap-3 rounded-sm bg-surface-container-lowest px-4 py-3.5">
        <span className="flex min-w-0 flex-col leading-snug">
          <span className="text-label text-on-surface-variant">{t(booking.customer ? messages.phoneVerified : messages.phoneRecorded)}</span>
          <span className="break-all font-bold tabular-nums">{phone}</span>
        </span>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={t(messages.chatLabel, { name: booking.bookerName })}
            className="pressable flex min-h-12 shrink-0 items-center gap-2 rounded-sm bg-band px-4 font-semibold text-on-signboard">
            <MessageCircle aria-hidden="true" className="size-5" />{t(messages.chat)}
          </a>
        )}
      </section>
      <section aria-labelledby="players" className="flex flex-col gap-2 rounded-sm bg-surface-container-lowest p-4">
        <h2 id="players" className="font-bold">{t(messages.players)}</h2>
        <ul className="flex flex-wrap gap-1.5">{booking.participants.map((name, index) => <li key={index} className="rounded-full bg-surface-container px-2.5 py-0.5 text-label">{name}</li>)}</ul>
      </section>
      <dl className="flex flex-col divide-y divide-outline-variant rounded-sm bg-surface-container-lowest px-4">
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
    </div>
  </>
}
