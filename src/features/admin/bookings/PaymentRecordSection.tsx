import { useRef, useState } from 'react'
import { Banknote } from 'lucide-react'
import type { AdminBookingDetailResponse, AdminRecordPaymentResponse, PaymentMethod } from '@shared/api/admin-bookings'
import { clubDateOf, clubToday, addClubDays } from '@shared/club-time'
import { effectiveBookingStatus } from '@shared/booking-rules'
import { Button } from '@/components/ui/button'
import { ChoiceChips } from '@/components/ui/choice-chips'
import { DateField } from '@/components/ui/date-field'
import { IntegerField } from '@/components/ui/integer-field'
import { Sheet } from '@/components/ui/sheet'
import { StatusPanel } from '@/components/ui/status-panel'
import { TextField } from '@/components/ui/text-field'
import { useToast } from '@/components/ui/use-toast'
import { formatClubDateShort, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { revealInvalid } from '@/lib/reveal-invalid'
import { useAdminAuth } from '../auth/use-admin-auth'
import { paymentRecordMessages as messages } from './bookings.messages'

const METHODS: PaymentMethod[] = ['cash', 'transfer', 'qris']

// Payments received outside the app (OPER-08): the ones recorded so far, and "Catat pembayaran" for a booking that is
// not paid yet. Saving confirms the booking (a toast says so). A booking past its deadline comes back only if its
// places are still free; the sheet says so before saving, and refuses truthfully if they are gone.
export function PaymentRecordSection({ data, onChanged }: { data: AdminBookingDetailResponse; onChanged: (detail: AdminBookingDetailResponse) => void }) {
  const { language, t } = useI18n()
  const { send } = useAdminAuth()
  const toast = useToast()
  const { booking } = data
  const now = new Date(data.serverNow)
  const lapsed = effectiveBookingStatus(booking.status, new Date(booking.originalDeadline), now) === 'expired'
  const canRecord = booking.status !== 'confirmed' && !booking.session.cancelled
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [amount, setAmount] = useState(String(booking.totalPriceIdr))
  const [paidOn, setPaidOn] = useState(clubToday())
  const [note, setNote] = useState('')
  const [amountError, setAmountError] = useState<string | undefined>()
  const [failure, setFailure] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const request = useRef<string>(crypto.randomUUID())
  const trigger = useRef<HTMLButtonElement>(null)
  const form = useRef<HTMLDivElement>(null)

  if (!canRecord && booking.payments.length === 0) return null

  const value = /^\d+$/.test(amount) ? Number(amount) : null
  const difference = value === null ? 0 : value - booking.totalPriceIdr
  const total = formatIdr(booking.totalPriceIdr, language)
  // A changed form is a different payment; the same form sent again (after a dropped reply) keeps its request id.
  const edit = <T,>(setter: (value: T) => void) => (next: T) => { setter(next); request.current = crypto.randomUUID(); setFailure(null) }

  const save = async () => {
    if (pending) return
    if (!value) { setAmountError(t(messages.amountRequired)); revealInvalid(form.current); return }
    setPending(true); setFailure(null)
    try {
      const result = await send<AdminRecordPaymentResponse>('POST', `/api/admin/bookings/${encodeURIComponent(booking.id)}/payments`, {
        version: booking.version, requestId: request.current, method, amountIdr: value, paidOn, ...(note.trim() ? { note: note.trim() } : {}),
      })
      if (result.kind === 'ok') { setOpen(false); toast({ message: t(messages.saved) }); onChanged(result.data); return }
      if (result.kind === 'http' && result.code === 'STALE_VERSION' && result.latest) { setFailure(t(messages.stale)); onChanged(result.latest as AdminBookingDetailResponse); return }
      if (result.kind === 'http' && result.code === 'CAPACITY_UNAVAILABLE') { setFailure(t(messages.full)); return }
      if (result.kind !== 'aborted') setFailure(t(messages.failed))
    } finally { setPending(false) }
  }

  return (
    <section aria-labelledby="payments-heading" className="flex flex-col gap-3 rounded-sm bg-surface-container-lowest p-4">
      <h2 id="payments-heading" className="font-bold">{t(messages.heading)}</h2>
      {booking.payments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {booking.payments.map(payment => (
            <li key={payment.id} className="flex items-start gap-3 rounded-sm bg-surface-container px-3 py-2.5">
              <Banknote aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="flex min-w-0 flex-1 flex-col leading-snug">
                <span className="font-semibold">{t(messages[payment.method])} · <span className="tabular-nums">{formatIdr(payment.amountIdr, language)}</span></span>
                <span className="text-label text-on-surface-variant">{t(messages.recordedBy, { date: formatClubDateShort(payment.paidOn, language), by: payment.recorded.by ?? '-' })}</span>
                {payment.note && <span className="break-words text-label">{payment.note}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canRecord && <Button ref={trigger} variant="outlined" className="self-start" onClick={() => { setFailure(null); setOpen(true) }}>{t(messages.record)}</Button>}

      <Sheet open={open} onClose={() => { if (!pending) setOpen(false) }} returnFocus={trigger} title={t(messages.sheetTitle)} description={t(messages.sheetDescription)} closeLabel={t(messages.cancel)}
        footer={<div className="grid grid-cols-2 gap-2">
          <Button variant="outlined" disabled={pending} onClick={() => setOpen(false)}>{t(messages.cancel)}</Button>
          <Button variant="filled" disabled={pending} pendingLabel={pending ? t(messages.saving) : undefined} onClick={() => void save()}>{t(messages.save)}</Button>
        </div>}>
        <div ref={form} className="flex flex-col gap-4">
          {lapsed && <StatusPanel tone="warning" title={t(messages.revive)} />}
          <ChoiceChips name="method" label={t(messages.method)} options={METHODS.map(id => ({ id, name: t(messages[id]) }))} value={method} onChange={value => edit(setMethod)(value as PaymentMethod)} />
          <div className="flex flex-col gap-1.5">
            <IntegerField label={t(messages.amount)} value={amount} error={amountError} onChange={event => { setAmountError(undefined); edit(setAmount)(event.target.value.replace(/\D/g, '')) }} />
            {difference !== 0 && value !== null && (
              <p className="notice-in text-label font-semibold text-warning">
                {t(difference < 0 ? messages.short : messages.over, { amount: formatIdr(Math.abs(difference), language), total })}
              </p>
            )}
          </div>
          <DateField name="paidOn" label={t(messages.paidOn)} value={paidOn} today={clubToday()} earliest={addClubDays(clubDateOf(new Date(booking.createdAt)), -1)} onChange={edit(setPaidOn)} />
          <TextField label={t(messages.note)} value={note} maxLength={300} onChange={event => edit(setNote)(event.target.value)} />
          {failure && <StatusPanel tone="error" title={failure} />}
        </div>
      </Sheet>
    </section>
  )
}
