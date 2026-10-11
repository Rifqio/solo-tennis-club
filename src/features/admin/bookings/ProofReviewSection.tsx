import { useRef, useState } from 'react'
import { FileText, MessageCircle, TriangleAlert } from 'lucide-react'
import type { AdminBookingDetailResponse, AdminProof, AdminProofReviewResponse } from '@shared/api/admin-bookings'
import type { ProofRejectionReason } from '@shared/api/customer-payments'
import { Button } from '@/components/ui/button'
import { ChoiceChips } from '@/components/ui/choice-chips'
import { Sheet } from '@/components/ui/sheet'
import { StatusPanel } from '@/components/ui/status-panel'
import { TextField } from '@/components/ui/text-field'
import { useToast } from '@/components/ui/use-toast'
import { formatClubDateShort, formatClubTime, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { revealInvalid } from '@/lib/reveal-invalid'
import { clubDateOf } from '@shared/club-time'
import { rejectionReasonMessages } from '@/features/customer/payments/payments.messages'
import { useAdminAuth } from '../auth/use-admin-auth'
import { adminRejectionReasons, proofReviewMessages as messages } from './bookings.messages'
import { whatsappHref } from './booking-facts'

const REASONS: ProofRejectionReason[] = ['amount_mismatch', 'unreadable', 'not_received', 'other']

function ProofFiles({ proof }: { proof: AdminProof }) {
  const { t } = useI18n()
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {proof.files.map(file => {
        const href = `/api/admin/proofs/${proof.id}/files/${file.id}`
        return (
          <li key={file.id}>
            {/* Opens full size in a new tab, where the phone's own pinch zoom works. */}
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={t(messages.open, { name: file.originalName })}
              className="state-layer pressable flex flex-col overflow-hidden rounded-sm border border-outline-variant bg-surface-container">
              {file.contentType.startsWith('image/')
                ? <img src={href} alt="" loading="lazy" className="aspect-[3/4] w-full object-cover" />
                : <span aria-hidden="true" className="flex aspect-[3/4] items-center justify-center text-primary"><FileText className="size-8" /></span>}
              <span className="truncate px-2 py-1.5 text-label">{file.originalName}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

// Reviewing a member's proof from the booking (phone page, desktop drawer; OPER-05, PAY-05, PAY-06, PAY-08): the
// files beside what is owed and by when, then Setujui or Tolak with a reason. The result is a toast; after a rejection
// a ready WhatsApp message tells the member, as the club has no automatic messages. A booking changed meanwhile shows
// its latest state with one notice.
export function ProofReviewSection({ data, onChanged }: { data: AdminBookingDetailResponse; onChanged: (detail: AdminBookingDetailResponse) => void }) {
  const { language, t } = useI18n()
  const { send } = useAdminAuth()
  const toast = useToast()
  const { booking } = data
  const pending = booking.status === 'awaiting_verification' ? booking.proofs.find(proof => proof.status === 'pending') ?? null : null
  const earlier = booking.proofs.filter(proof => proof !== pending)
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState<ProofRejectionReason | ''>('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<{ reason?: string; note?: string }>({})
  const [followUp, setFollowUp] = useState<{ outcome: 'needs_correction' | 'expired'; reason: ProofRejectionReason; note: string | null } | null>(null)
  const sheetBody = useRef<HTMLDivElement>(null)
  const rejectButton = useRef<HTMLButtonElement>(null)

  const deadline = Date.parse(booking.originalDeadline)
  const passed = deadline <= Date.parse(data.serverNow)
  const deadlineDate = clubDateOf(new Date(deadline))
  const deadlineText = `${formatClubDateShort(deadlineDate, language)}, ${formatClubTime(booking.originalDeadline)}`
  const time = (iso: string) => `${formatClubDateShort(clubDateOf(new Date(iso)), language)}, ${formatClubTime(iso)}`

  const decide = async (action: 'approve' | 'reject') => {
    if (!pending || busy) return
    if (action === 'reject') {
      const problems = { reason: reason ? undefined : t({ id: 'Pilih alasannya.', en: 'Choose a reason.' }), note: reason === 'other' && !note.trim() ? t({ id: 'Tulis alasannya untuk pemesan.', en: 'Write the reason for the booker.' }) : undefined }
      setErrors(problems)
      if (problems.reason || problems.note) { revealInvalid(sheetBody.current); return }
    }
    setBusy(action); setNotice(null)
    try {
      const body = action === 'approve' ? { version: booking.version } : { version: booking.version, reason, ...(note.trim() ? { note: note.trim() } : {}) }
      const result = await send<AdminProofReviewResponse>('POST', `/api/admin/bookings/${encodeURIComponent(booking.id)}/proofs/${encodeURIComponent(pending.id)}/${action}`, body)
      if (result.kind === 'ok') {
        setRejecting(false)
        if (result.data.outcome === 'confirmed') toast({ message: t(messages.approved, { name: booking.bookerName }) })
        else {
          toast({ message: t(result.data.outcome === 'expired' ? messages.rejectedReleased : messages.rejected) })
          setFollowUp({ outcome: result.data.outcome, reason: reason as ProofRejectionReason, note: note.trim() || null })
        }
        onChanged(result.data)
        return
      }
      if (result.kind === 'http' && result.code === 'STALE_VERSION' && result.latest) {
        setRejecting(false); setNotice(t(messages.stale)); onChanged(result.latest as AdminBookingDetailResponse); return
      }
      if (result.kind !== 'aborted') setNotice(t(messages.failed))
    } finally { setBusy(null) }
  }

  const wa = whatsappHref(booking.customer?.phone ?? booking.bookerPhone)
  const session = `${booking.session.className} ${formatClubDateShort(booking.session.date, language)} ${booking.session.startTime}`
  const followUpHref = followUp && wa ? `${wa}?text=${encodeURIComponent(t(followUp.outcome === 'expired' ? messages.waReleased : messages.waRejected, {
    name: booking.bookerName, session, time: formatClubTime(booking.originalDeadline),
    reason: `${t(rejectionReasonMessages[followUp.reason])}${followUp.note ? ` ${followUp.note}` : ''}`,
  }))}` : null

  // Only about proofs: a booking paid outside the app shows its payment in the Pembayaran section instead.
  if (booking.proofs.length === 0 && !followUp && !notice) return null
  const approvedProof = booking.proofs.some(proof => proof.status === 'approved')
  return (
    <section aria-labelledby="proof-heading" className="flex flex-col gap-3 rounded-sm bg-surface-container-lowest p-4">
      <h2 id="proof-heading" className="font-bold">{t(messages.heading)}</h2>
      {notice && <StatusPanel tone="info" title={notice} />}
      {booking.confirmed && approvedProof && (
        <p className="text-label text-on-surface-variant">{t(messages.confirmedBy, { when: time(booking.confirmed.at), by: booking.confirmed.by ? t(messages.by, { name: booking.confirmed.by }) : '' })}</p>
      )}
      {followUpHref && (
        <a href={followUpHref} target="_blank" rel="noopener noreferrer" className="state-layer pressable flex min-h-12 items-center justify-center gap-2 rounded-sm bg-band-tile px-4 font-semibold text-on-signboard">
          <MessageCircle aria-hidden="true" className="size-5" />{t(messages.chat, { name: booking.bookerName })}
        </a>
      )}
      {pending && <>
        <dl className="grid grid-cols-2 gap-2 text-label">
          <div className="rounded-sm bg-surface-container px-3 py-2"><dt className="text-on-surface-variant">{t(messages.expected)}</dt><dd className="text-title font-bold tabular-nums">{formatIdr(booking.totalPriceIdr, language)}</dd></div>
          <div className="rounded-sm bg-surface-container px-3 py-2"><dt className="text-on-surface-variant">{t(messages.deadline)}</dt><dd className="font-semibold tabular-nums">{deadlineText}</dd></div>
        </dl>
        <p className="text-label text-on-surface-variant">{t(messages.sentAt, { time: time(pending.submittedAt) })}</p>
        {passed && <p className="flex items-start gap-2 text-label font-semibold text-warning"><TriangleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />{t(messages.deadlinePassed)}</p>}
        <ProofFiles proof={pending} />
        <div className="grid grid-cols-2 gap-2">
          <Button ref={rejectButton} variant="outlined" disabled={busy !== null} onClick={() => { setErrors({}); setRejecting(true) }}>{t(messages.reject)}</Button>
          <Button variant="filled" disabled={busy !== null} pendingLabel={busy === 'approve' ? t(messages.approving) : undefined} onClick={() => void decide('approve')}>{t(messages.approve)}</Button>
        </div>
      </>}
      {earlier.length > 0 && (
        <details className="group rounded-sm bg-surface-container px-3 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex min-h-12 cursor-pointer items-center font-semibold">{t(messages.history, { count: earlier.length })}</summary>
          <ul className="flex flex-col gap-3 pb-3">
            {earlier.map(proof => (
              <li key={proof.id} className="flex flex-col gap-2">
                <p className="text-label">
                  <span className="font-semibold">{t(proof.status === 'approved' ? messages.statusApproved : messages.statusRejected)}</span>
                  {proof.rejectionReason && ` · ${t(adminRejectionReasons[proof.rejectionReason])}${proof.rejectionNote ? `: ${proof.rejectionNote}` : ''}`}
                  {proof.reviewed && <span className="block text-on-surface-variant">{t(messages.reviewedBy, { when: time(proof.reviewed.at), name: proof.reviewed.by ?? '-' })}</span>}
                </p>
                <ProofFiles proof={proof} />
              </li>
            ))}
          </ul>
        </details>
      )}

      <Sheet open={rejecting} onClose={() => { if (!busy) setRejecting(false) }} returnFocus={rejectButton} title={t(messages.rejectTitle)} description={t(messages.rejectDescription)} closeLabel={t(messages.cancel)}
        footer={<div className="grid grid-cols-2 gap-2">
          <Button variant="outlined" disabled={busy !== null} onClick={() => setRejecting(false)}>{t(messages.cancel)}</Button>
          <Button variant="destructive" disabled={busy !== null} pendingLabel={busy === 'reject' ? t(messages.rejecting) : undefined} onClick={() => void decide('reject')}>{t(messages.confirmReject)}</Button>
        </div>}>
        <div ref={sheetBody} className="flex flex-col gap-4">
          <p className="text-on-surface-variant">{passed ? t(messages.rejectAfter) : t(messages.rejectBefore, { time: deadlineText })}</p>
          <ChoiceChips name="reason" label={t(messages.reason)} options={REASONS.map(id => ({ id, name: t(adminRejectionReasons[id]) }))}
            value={reason} onChange={value => { setReason(value as ProofRejectionReason); setErrors(current => ({ ...current, reason: undefined })) }} error={errors.reason} />
          <TextField label={t(messages.note)} hint={t(messages.noteHint)} value={note} maxLength={300} error={errors.note}
            onChange={event => { setNote(event.target.value); setErrors(current => ({ ...current, note: undefined })) }} />
        </div>
      </Sheet>
    </section>
  )
}
