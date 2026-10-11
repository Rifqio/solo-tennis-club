import { useLocation, useParams } from 'react-router-dom'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { AdminBand } from '../shell/AdminBand'
import { adminBookingsMessages as messages } from './bookings.messages'
import { BookingDetailBody } from './BookingDetailBody'
import { bookingFacts } from './booking-facts'
import { useAdminBooking } from './use-admin-booking'
import type { CreatedBookingState } from './AdminBookingFormPage'

// Phones (board 15): the booking on its own screen. Desktop (board D6) opens it in the drawer beside the table
// (bookings-route).
export function Component() {
  const { id = '' } = useParams()
  return <BookingDetailScreen id={id} />
}

function BookingDetailScreen({ id }: { id: string }) {
  const created = (useLocation().state as CreatedBookingState | null)?.created ?? null
  const { language, t } = useI18n()
  const { response, retry, replace } = useAdminBooking(id)
  const back = { to: '/admin/bookings', label: t(messages.back) }

  if (response?.kind !== 'ok') {
    return <>
      <AdminBand title={t(messages.heading)} back={back} />
      <div className="page-gutter mx-auto w-full max-w-[50rem] py-4">
        {!response ? <p role="status" className="appear-late">{t(messages.loading)}</p>
          : response.kind === 'http' && response.status === 404 ? <StatusPanel tone="info" title={t(messages.missing)} />
          : <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: retry }} />}
      </div>
    </>
  }

  const { booking } = response.data
  const { status, deadline } = bookingFacts(response.data, language)
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
      <BookingDetailBody data={response.data} created={created} onChanged={replace} />
    </div>
  </>
}
