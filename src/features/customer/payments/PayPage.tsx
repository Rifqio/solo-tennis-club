import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronLeft, Download, FileText, MessageCircle } from 'lucide-react'
import type { CustomerPaymentResponse, ProofSummary } from '@shared/api/customer-payments'
import { clubDateOf } from '@shared/club-time'
import { Button } from '@/components/ui/button'
import { ConnectionBanner } from '@/components/ui/connection-banner'
import { PopIn } from '@/components/ui/pop-in'
import { SelectionBase, SelectionMark } from '@/components/ui/selection-mark'
import { StatusPanel } from '@/components/ui/status-panel'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatClubTime, formatClubWeekdayShort, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { setNavMotion } from '@/lib/nav-motion'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { clubContent } from '@/features/public/club/club-content'
import { useNow } from '@/features/public/schedule/use-now'
import { useCustomerAccess } from '@/features/customer/auth/use-customer-access'
import { serverClock } from '@/features/customer/my-bookings/use-customer-bookings'
import { paymentDetails } from './payment-details'
import { paymentMessages as messages, rejectionReasonMessages } from './payments.messages'
import { ProofPicker } from './ProofPicker'
import { SampleQr } from './SampleQr'
import { SAMPLE_QR_SRC } from './sample-qr'
import { uploadProof } from './upload-proof'
import { usePayment } from './use-payment'

const whatsappHref = clubContent.whatsapp ? `https://wa.me/${clubContent.whatsapp}` : null

// The band (board D8): back, "Bayar booking", the booking in one line, and when payment is due with the time left.
function PayBand({ line, due }: { line?: string; due?: ReactNode }) {
  const { t } = useI18n()
  return <>
    <header className="desk-column rounded-b-lg bg-band pb-4 pt-[env(safe-area-inset-top)] text-on-signboard [view-transition-name:app-bar] [&_:focus-visible]:outline-white lg:mt-5 lg:rounded-lg lg:py-4">
      <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-3 pt-3 lg:max-w-none lg:flex-row lg:items-center lg:justify-between lg:px-5 lg:pt-0">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/bookings" viewTransition data-nav="pop" aria-label={t(messages.back)}
            className="state-layer pressable flex size-12 shrink-0 items-center justify-center rounded-full bg-band-tile"><ChevronLeft aria-hidden="true" className="size-6" /></Link>
          <div className="flex min-w-0 flex-col leading-tight">
            <h1 className="text-headline font-bold lg:text-display">{t(messages.title)}</h1>
            {line && <p className="break-words">{line}</p>}
          </div>
        </div>
        {due}
      </div>
    </header>
    <ConnectionBanner voice="member" className="page-gutter desk-column mx-auto w-full max-w-[50rem] lg:max-w-none" />
  </>
}

// Copies a value; the button itself says it worked (the result shows where the action was, G1: no extra toast).
function CopyButton({ value, what, tone = 'light' }: { value: string; what: string; tone?: 'light' | 'onBand' }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (!copied) return; const timer = window.setTimeout(() => setCopied(false), 2000); return () => window.clearTimeout(timer) }, [copied])
  return (
    <button type="button" aria-label={t(messages.copyLabel, { what })}
      onClick={() => { void navigator.clipboard?.writeText(value).then(() => setCopied(true), () => undefined) }}
      className={cn('state-layer pressable flex min-h-12 shrink-0 items-center gap-1.5 rounded-sm px-3.5 font-semibold',
        tone === 'onBand' ? 'bg-surface-container-lowest text-primary' : 'bg-primary-container text-primary')}>
      <PopIn show={copied} className="flex"><Check className="size-4" strokeWidth={3} /></PopIn>
      <span aria-live="polite">{t(copied ? messages.copied : messages.copy)}</span>
    </button>
  )
}

function MethodCard() {
  const { t } = useI18n()
  const [method, setMethod] = useState<'qris' | 'bank'>('qris')
  const qrLabel = t(messages.sampleQrLabel)
  const saveHref = paymentDetails.qrisImageSrc ?? SAMPLE_QR_SRC
  return (
    <section aria-label={t(messages.howToPay)} className="flex min-w-0 flex-col items-center gap-5 rounded-lg bg-surface-container-lowest p-5 lg:p-6">
      <div role="tablist" aria-label={t(messages.methods)} className="isolate grid w-full grid-cols-2 gap-1 rounded-full bg-surface-container p-1">
        {(['qris', 'bank'] as const).map(value => (
          <button key={value} type="button" role="tab" aria-selected={method === value} onClick={() => setMethod(value)}
            className={cn('selection-item pressable flex min-h-12 items-center justify-center rounded-full font-semibold', method === value ? 'text-on-signboard' : 'text-on-surface')}>
            {method === value ? <SelectionMark layoutId="pay-method" className="rounded-full bg-band-tile" /> : <SelectionBase className="rounded-full" />}
            {t(value === 'qris' ? messages.qris : messages.bank)}
          </button>
        ))}
      </div>
      {method === 'qris' ? <>
        <figure className="m-0 flex flex-col items-center gap-3 rounded-md border border-outline-variant p-4">
          <figcaption className="flex flex-col items-center leading-tight">
            <strong className="tracking-[0.08em]">QRIS</strong>
            <span className="text-label text-on-surface-variant">{paymentDetails.merchantName}{paymentDetails.nmid ? ` · NMID ${paymentDetails.nmid}` : ''}</span>
          </figcaption>
          {paymentDetails.qrisImageSrc
            ? <img src={paymentDetails.qrisImageSrc} alt={`QRIS ${paymentDetails.merchantName}`} className="size-60 object-contain" />
            : <SampleQr label={qrLabel} className="size-60" />}
          {paymentDetails.sample && <span className="rounded-full bg-warning-container px-3 py-0.5 text-label font-semibold text-warning">{t(messages.sampleQr)}</span>}
        </figure>
        <p className="max-w-sm text-center text-on-surface-variant">{t(messages.scan)}</p>
        <p className="max-w-sm text-center text-label text-on-surface-variant">{t(messages.scanSamePhone)}</p>
        <Button asChild variant="outlined">
          <a href={saveHref} download={paymentDetails.qrisImageSrc ? undefined : 'qris-contoh-STC.svg'}><Download aria-hidden="true" className="size-5" />{t(messages.saveQr)}</a>
        </Button>
      </> : (
        <div className="flex w-full flex-col">
          <dl className="flex flex-col">
            <div className="flex justify-between gap-4 border-b border-outline-variant py-4"><dt className="text-on-surface-variant">{t(messages.bankName)}</dt><dd className="font-bold">{paymentDetails.bankName}</dd></div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-outline-variant py-3">
              <dt className="text-on-surface-variant">{t(messages.account)}</dt>
              <dd className="flex items-center gap-2"><strong className="text-title tabular-nums">{paymentDetails.accountNumber}</strong><CopyButton value={paymentDetails.accountNumber} what={t(messages.account)} /></dd>
            </div>
            <div className="flex justify-between gap-4 py-4"><dt className="text-on-surface-variant">{t(messages.holder)}</dt><dd className="text-right font-bold">{paymentDetails.accountHolder}</dd></div>
          </dl>
          {paymentDetails.sample && <span className="self-center rounded-full bg-warning-container px-3 py-0.5 text-label font-semibold text-warning">{t(messages.sampleBank)}</span>}
        </div>
      )}
    </section>
  )
}

function TotalCard({ amount, rupiah }: { amount: number; rupiah: string }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-1 rounded-md bg-band-tile p-4 text-on-signboard [&_:focus-visible]:outline-white">
      <span className="text-label">{t(messages.total)}</span>
      <span className="flex items-center justify-between gap-3">
        <strong className="text-display font-bold leading-tight tabular-nums">{rupiah}</strong>
        <CopyButton value={String(amount)} what={t(messages.total)} tone="onBand" />
      </span>
      <span className="text-label">{t(messages.exact)}</span>
    </div>
  )
}

function Steps({ done }: { done: number }) {
  const { t } = useI18n()
  return (
    <ol aria-label={t(messages.stepsLabel)} className="flex flex-col gap-3">
      {messages.steps.map((step, index) => (
        <li key={step.en} className="flex items-center gap-3">
          <span aria-hidden="true" className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-label font-bold',
            index < done ? 'bg-band-tile text-on-signboard' : index === done ? 'bg-accent text-on-accent' : 'bg-surface-container text-on-surface-variant')}>
            {index < done ? <Check className="size-4" strokeWidth={3} /> : index + 1}
          </span>
          <span>{t(step)}</span>
        </li>
      ))}
    </ol>
  )
}

function SentFiles({ bookingId, proof }: { bookingId: string; proof: ProofSummary }) {
  const { t } = useI18n()
  return (
    <section aria-label={t(messages.sentFiles)} className="flex flex-col gap-2">
      <h2 className="text-label font-semibold text-on-surface-variant">{t(messages.sentFiles)}</h2>
      <ul className="flex flex-col gap-2">
        {proof.files.map(file => (
          <li key={file.id}>
            <a href={`/api/customer/bookings/${bookingId}/proofs/${proof.id}/files/${file.id}`} target="_blank" rel="noopener noreferrer"
              className="state-layer pressable flex min-h-12 items-center gap-3 rounded-sm bg-surface-container px-3 py-2">
              <FileText aria-hidden="true" className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate">{file.originalName}</span>
              <span className="text-label font-semibold text-primary">{t(messages.open)}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

type SendState = { kind: 'idle' } | { kind: 'sending'; percent: number } | { kind: 'failed'; message: string; late?: boolean } | { kind: 'sent'; proof: ProofSummary }

// Sending the proof (board D8, right card): pick up to three files, send them, and know truthfully whether they
// arrived. Success replaces the upload area with "Bukti terkirim" (the screen is the result, so no toast). A broken
// upload keeps the files and the same submission, so trying again can never send it twice.
function ProofSender({ data, csrfToken, onSignInNeeded, onSent, deadlineLeftMs }: { data: CustomerPaymentResponse; csrfToken: string | null; onSignInNeeded: () => void; onSent: () => void; deadlineLeftMs: number }) {
  const { t } = useI18n()
  const [files, setFiles] = useState<File[]>([])
  const [send, setSend] = useState<SendState>({ kind: 'idle' })
  const [missing, setMissing] = useState(false)
  const submission = useRef(crypto.randomUUID())
  const sending = send.kind === 'sending'
  const changeFiles = (next: File[]) => { setFiles(next); setMissing(false); submission.current = crypto.randomUUID(); if (send.kind === 'failed') setSend({ kind: 'idle' }) }

  const submit = async () => {
    if (sending) return
    if (!files.length) { setMissing(true); return }
    if (!csrfToken) { onSignInNeeded(); return }
    setSend({ kind: 'sending', percent: 0 })
    const outcome = await uploadProof(data.booking.id, { submissionId: submission.current, files, csrfToken }, percent => setSend({ kind: 'sending', percent }))
    if (outcome.kind === 'ok') { setSend({ kind: 'sent', proof: outcome.data.proof }); onSent(); return }
    if (outcome.kind === 'aborted') { setSend({ kind: 'idle' }); return }
    if (outcome.kind === 'network') { setSend({ kind: 'failed', message: t(messages.offline) }); return }
    if (outcome.error.code === 'CUSTOMER_UNAUTHENTICATED') { setSend({ kind: 'idle' }); onSignInNeeded(); return }
    if (outcome.error.code === 'PAYMENT_DEADLINE_PASSED') { setSend({ kind: 'failed', message: t(messages.late), late: true }); return }
    setSend({ kind: 'failed', message: t(apiErrorMessages[outcome.error.code] ?? apiErrorMessages.INTERNAL) })
  }

  if (send.kind === 'sent') {
    return (
      <div className="flex flex-col gap-3">
        <div role="status" className="notice-in flex items-center gap-3.5 rounded-md bg-primary-container p-5">
          <PopIn show className="flex size-12 shrink-0 items-center justify-center rounded-full bg-band-tile text-on-signboard"><Check className="size-6" strokeWidth={3} /></PopIn>
          <span className="flex flex-col leading-snug"><strong>{t(messages.sentTitle)}</strong><span className="text-on-surface-variant">{t(messages.sentBody)}</span></span>
        </div>
        <Button asChild variant="outlined" className="min-h-13"><Link to={`/bookings/${data.booking.id}`} viewTransition data-nav="pop">{t(messages.back)}</Link></Button>
      </div>
    )
  }

  const minutesLeft = Math.ceil(deadlineLeftMs / 60_000)
  return (
    <div className="flex flex-col gap-3">
      {minutesLeft <= 10 && minutesLeft > 0 && send.kind !== 'failed' && <StatusPanel tone="warning" title={t(messages.hurry, { minutes: minutesLeft })} />}
      <ProofPicker files={files} onChange={changeFiles} disabled={sending} error={missing ? t(messages.fileNeeded) : undefined} />
      {send.kind === 'failed' && (
        <StatusPanel tone="error" title={send.message}>
          {send.late && <p>{t(messages.lateBody)}</p>}
          {send.late && whatsappHref && <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-12 items-center gap-2 font-semibold underline underline-offset-4"><MessageCircle aria-hidden="true" className="size-5" />{t(messages.chatAdmin)}</a>}
        </StatusPanel>
      )}
      {!(send.kind === 'failed' && send.late) && (
        <Button variant="filled" className="min-h-14 w-full" onClick={() => void submit()} disabled={sending}
          pendingLabel={sending ? t(messages.sending, { percent: send.percent }) : undefined}>
          {t(data.booking.status === 'needs_correction' ? messages.sendNew : messages.send)}
        </Button>
      )}
    </div>
  )
}

export function Component() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { language, t } = useI18n()
  const { load, retry } = usePayment(id)
  const access = useCustomerAccess()
  const localNow = useNow(1_000)
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  // Once the proof is in, the deadline no longer applies and the steps move on.
  const [sent, setSent] = useState(false)
  const signIn = () => { setNavMotion('push'); navigate(`/customer/sign-in?returnTo=${encodeURIComponent(`/bookings/${id}/pay`)}`, { viewTransition: true }) }

  if (load.status !== 'ready') {
    return <>
      <PayBand />
      <div className="page-gutter mx-auto w-full max-w-[50rem] py-4">
        {load.status === 'loading' ? <p role="status" className="appear-late">{t(messages.loading)}</p>
          : load.status === 'signedOut' ? <StatusPanel tone="info" title={t(messages.signIn)} action={{ label: t(messages.signInAction), onAction: signIn }} />
          : load.status === 'missing' ? <StatusPanel tone="info" title={t(messages.missing)} />
          : <StatusPanel tone="error" title={t(messages.loadError)} action={{ label: t(commonMessages.retry), onAction: retry }} />}
      </div>
    </>
  }

  const { data } = load
  const { booking } = data
  const now = serverClock(data.serverNow, load.receivedAt, localNow)
  const deadline = Date.parse(booking.originalDeadline)
  const leftMs = Math.max(0, deadline - now)
  const deadlineDate = clubDateOf(new Date(deadline))
  const when = `${deadlineDate === clubDateOf(new Date(now)) ? '' : formatClubWeekdayShort(deadlineDate, language) + ' '}${formatClubTime(booking.originalDeadline)}`
  const hours = Math.floor(leftMs / 3_600_000)
  const minutes = Math.floor((leftMs % 3_600_000) / 60_000)
  const line = t(messages.line, { date: formatClubDateShort(booking.session.date, language), time: booking.session.startTime, count: booking.quantity })
  const payable = data.canSubmit && leftMs > 0
  const due = payable && !sent && (
    <p className="flex min-h-12 items-center gap-2 self-start rounded-full bg-band-tile px-4 tabular-nums lg:self-auto">
      <span>{t(messages.payBy, { when })} · <strong>{t(messages.left, { time: `${hours}:${String(minutes).padStart(2, '0')}` })}</strong></span>
    </p>
  )
  const rupiah = formatIdr(booking.totalPriceIdr, language)
  const rejected = data.latestProof?.status === 'rejected' ? data.latestProof : null
  const csrfToken = access.state.stage === 'complete' ? access.state.session.csrfToken : null

  // Nothing left to pay: one notice saying where the booking stands, and the way back.
  if (!payable) {
    const notice = booking.session.cancelled ? <StatusPanel tone="info" title={t(messages.cancelledTitle)} />
      : booking.status === 'confirmed' ? <StatusPanel tone="info" title={t(messages.paidTitle)} />
      : booking.status === 'awaiting_verification' ? <StatusPanel tone="info" title={t(messages.reviewTitle)}><p>{t(messages.reviewBody)}</p></StatusPanel>
      : <StatusPanel tone="warning" title={t(messages.late)}>
          <p>{t(messages.lateBody)}</p>
          {whatsappHref && <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-12 items-center gap-2 font-semibold underline underline-offset-4"><MessageCircle aria-hidden="true" className="size-5" />{t(messages.chatAdmin)}</a>}
        </StatusPanel>
    return <>
      <PayBand line={line} />
      <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-3 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {notice}
        {booking.status === 'awaiting_verification' && data.latestProof && <SentFiles bookingId={booking.id} proof={data.latestProof} />}
        <Button asChild variant="outlined" className="self-start"><Link to={`/bookings/${booking.id}`} viewTransition data-nav="pop">{t(messages.back)}</Link></Button>
      </div>
    </>
  }

  const rejection = rejected && (
    <StatusPanel tone="warning" title={t(messages.rejectedTitle)}>
      <p>{t(rejectionReasonMessages[rejected.rejectionReason ?? 'other'])}{rejected.rejectionNote ? ` ${rejected.rejectionNote}` : ''}</p>
      <p>{t(messages.rejectedBody, { when })}</p>
    </StatusPanel>
  )
  const sender = <ProofSender data={data} csrfToken={csrfToken} onSignInNeeded={signIn} onSent={() => setSent(true)} deadlineLeftMs={leftMs} />

  return <>
    <PayBand line={line} due={due} />
    {isDesktop ? (
      <div className="desk-column flex flex-col gap-5 py-5">
        {rejection}
        <div className="flex items-stretch gap-5">
          <div className="min-w-0 flex-1"><MethodCard /></div>
          <section aria-label={t(messages.upload)} className="flex min-w-0 flex-1 flex-col gap-5 rounded-lg bg-surface-container-lowest p-6">
            <TotalCard amount={booking.totalPriceIdr} rupiah={rupiah} />
            <Steps done={sent ? 2 : 0} />
            <div className="mt-auto">{sender}</div>
          </section>
        </div>
      </div>
    ) : (
      <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-3 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {rejection}
        <TotalCard amount={booking.totalPriceIdr} rupiah={rupiah} />
        <MethodCard />
        <section aria-label={t(messages.upload)} className="flex flex-col gap-4 rounded-lg bg-surface-container-lowest p-5">
          <Steps done={sent ? 2 : 0} />
          {sender}
        </section>
      </div>
    )}
  </>
}
