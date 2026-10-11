import { useEffect, useState } from 'react'
import { AlertDialog } from 'radix-ui'
import { BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import type { AdminResult } from '@/lib/admin-api'
import type { AdminBookingDetailResponse, VerifiedCustomerLookupResponse } from '@shared/api/admin-bookings'
import { useAdminAuth } from '../auth/use-admin-auth'
import { adminBookingLinkMessages as messages } from './bookings.messages'
import { useToast } from '@/components/ui/use-toast'

type Booking = AdminBookingDetailResponse['booking']

// For a booking an admin recorded: look up the verified account with the exact same number and, on the admin's
// explicit confirmation, give the booking to it. Nothing is matched or moved automatically.
export function BookingLinkSection({ booking, onChanged, onLinkedElsewhere }: { booking: Booking; onChanged: (detail: AdminBookingDetailResponse) => void; onLinkedElsewhere: (notice: string) => void }) {
  const toast = useToast()
  const { t } = useI18n()
  const { get, send } = useAdminAuth()
  const [lookup, setLookup] = useState<{ phone: string; response: AdminResult<VerifiedCustomerLookupResponse> } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const phone = booking.bookerPhone

  useEffect(() => {
    const controller = new AbortController()
    void get<VerifiedCustomerLookupResponse>(`/api/admin/verified-customers?phone=${encodeURIComponent(phone)}`, controller.signal)
      .then(response => { if (!controller.signal.aborted) setLookup({ phone, response }) })
    return () => controller.abort()
  }, [get, phone, attempt])

  const response = lookup?.phone === phone ? lookup.response : null
  const customer = response?.kind === 'ok' ? response.data.customer : null
  const recheck = () => { setLookup(null); setFailure(null); setAttempt(value => value + 1) }

  async function link() {
    if (!customer || pending) return
    setPending(true); setFailure(null)
    try {
      const result = await send<AdminBookingDetailResponse>('PUT', `/api/admin/bookings/${encodeURIComponent(booking.id)}/customer-link`, { customerId: customer.id, version: booking.version })
      if (result.kind === 'ok') {
        setConfirming(false)
        toast({ message: t(messages.linked, { name: customer.displayName }) })
        onChanged(result.data)
        requestAnimationFrame(() => document.getElementById('booking-phone')?.focus())
        return
      }
      setConfirming(false)
      if (result.kind === 'network') { setFailure(t(messages.linkFailed)); return }
      if (result.kind !== 'http') return
      if (result.code === 'STALE_VERSION' || result.code === 'BOOKING_ALREADY_LINKED') {
        const latest = result.latest as AdminBookingDetailResponse | undefined
        const message = t(result.code === 'STALE_VERSION' ? messages.stale : apiErrorMessages.BOOKING_ALREADY_LINKED)
        // Linked by someone else meanwhile: this section disappears with the update, so the reason shows above it.
        if (latest?.booking.customer) onLinkedElsewhere(message)
        else setFailure(message)
        if (latest) onChanged(latest)
        return
      }
      if (result.code === 'NOT_FOUND' || result.code === 'CUSTOMER_MISMATCH') recheck()
      setFailure(t(apiErrorMessages[result.code]))
    } finally { setPending(false) }
  }

  return (
    <section aria-labelledby="booker-account" className="flex flex-col gap-3 rounded-sm bg-surface-container-lowest p-4">
      <h2 id="booker-account" className="font-bold">{t(messages.heading)}</h2>
      {!response && <p role="status" className="text-on-surface-variant">{t(messages.searching, { phone })}</p>}
      {response && response.kind !== 'ok' && <StatusPanel tone="error" title={t(messages.searchError)} action={{ label: t(commonMessages.retry), onAction: recheck }} />}
      {response?.kind === 'ok' && !customer && <>
        <div className="flex flex-col gap-1">
          <p className="break-words font-semibold">{t(messages.none, { phone })}</p>
          <p className="text-label text-on-surface-variant">{t(messages.noneBody)}</p>
        </div>
        <Button variant="outlined" className="self-start" onClick={recheck}>{t(messages.checkAgain)}</Button>
      </>}
      {customer && <>
        <div className="flex items-start gap-3 rounded-sm bg-secondary-container p-3.5 text-on-secondary-container">
          <BadgeCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p className="flex min-w-0 flex-col leading-snug">
            <span className="text-label">{t(messages.found)}</span>
            <span className="break-words font-bold">{customer.displayName}</span>
            <span className="text-label tabular-nums">{customer.phone}</span>
          </p>
        </div>
        <p className="text-label text-on-surface-variant">{t(messages.foundBody, { name: customer.displayName })}</p>
        <Button variant="filled" className="self-stretch sm:self-start" disabled={pending} onClick={() => setConfirming(true)}>{t(messages.link, { name: customer.displayName })}</Button>
      </>}
      {failure && <StatusPanel tone="error" title={failure} />}
      <p className="border-t border-outline-variant pt-3 text-label text-on-surface-variant">{t(messages.lostNumber)}</p>

      <AlertDialog.Root open={confirming && Boolean(customer)} onOpenChange={open => { if (!open && !pending) setConfirming(false) }}><AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-scrim dialog-scrim" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl bg-surface-container p-5 text-on-surface shadow-sheet dialog-panel">
          <AlertDialog.Title className="text-title font-bold">{t(messages.confirmTitle, { name: customer?.displayName ?? '' })}</AlertDialog.Title>
          <AlertDialog.Description>{t(messages.foundBody, { name: customer?.displayName ?? '' })} {t(messages.confirmBody)}</AlertDialog.Description>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <AlertDialog.Cancel asChild><Button variant="tonal" disabled={pending}>{t(messages.keep)}</Button></AlertDialog.Cancel>
            <Button variant="filled" disabled={pending} pendingLabel={pending ? t(messages.linking) : undefined} onClick={() => void link()}>{t(messages.confirm)}</Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal></AlertDialog.Root>
    </section>
  )
}
