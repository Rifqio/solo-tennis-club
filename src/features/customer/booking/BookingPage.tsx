import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, ChevronLeft, Clock, Minus, Plus, UserRound } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { m, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Scoreboard } from '@/components/ui/scoreboard'
import { TextField } from '@/components/ui/text-field'
import { StatusPanel } from '@/components/ui/status-panel'
import { useI18n } from '@/i18n/use-i18n'
import { formatClubDateLong, formatClubDateMedium, formatClubTime, formatIdr } from '@/i18n/format'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { cn } from '@/lib/utils'
import type { PublicSessionDetail } from '@shared/api/public'
import { normalizeCustomerName } from '@shared/customer-rules'
import { CustomerApiError, customerRequest } from '@/lib/customer-api'
import { useNow } from '@/features/public/schedule/use-now'
import { useCustomerAccess } from '../auth/use-customer-access'

type Options = { sessionVersion: number; unitPriceIdr: number; remainingPlaces: number; bookingClosesAt: string; serverNow: string; canReserve: boolean }
type CreatedBooking = { booking: { id: string; quantity: number; totalPriceIdr: number; originalDeadline: string; participants: { id: string; position: number; name: string }[] }; replayed: boolean; serverNow: string }

// Casual Indonesian with the English words members already use (booking, slot), matching onboarding.
const messages = {
  id: {
    title: 'Pesan slot', names: 'Siapa aja yang main?', review: 'Cek dulu, ya', success: 'Booking masuk!',
    steps: ['Jumlah', 'Pemain', 'Cek'], stepLabel: 'Langkah {step} dari 3',
    loading: 'Memuat sesi…', unavailable: 'Sesi ini nggak bisa dipesan.', retry: 'Coba lagi',
    howMany: 'Berapa orang yang main?', fewer: 'Kurangi', more: 'Tambah', left: 'Sisa {count} slot',
    pricePerSlot: 'Harga per slot', slots: '{count} slot', total: 'Total', totalFor: 'Total, {count} slot',
    continue: 'Lanjut', signIn: 'Login dulu', nameHint: 'Nama ini disimpan di booking dan dilihat teman main. Bisa kamu ganti.',
    player: 'Pemain {n}', you: '(kamu)', previous: 'Sebelumnya', next: 'Berikutnya',
    date: 'Tanggal', venue: 'Lokasi', players: 'Pemain ({count})', editPlayers: 'Ubah pemain',
    holdTitle: 'Bayar dalam 5 jam', holdBody: 'Lewat dari itu, slot kamu dilepas.',
    confirm: 'Konfirmasi booking', working: 'Menyimpan booking…', closed: 'Booking sudah ditutup atau slotnya penuh.',
    safe: '{count} slot kamu aman sampai batas bayar.', timeLeft: 'Sisa waktu bayar {h} jam {m} menit', hours: 'jam', minutes: 'menit',
    payBy: 'Bayar sebelum', payTitle: 'Cara bayar (QRIS atau transfer)', payBody: 'Info pembayaran akan muncul di sini. Sementara itu, hubungi admin klub.',
    backToSchedule: 'Kembali ke jadwal', back: 'Kembali', backToScheduleLabel: 'Kembali ke jadwal',
  },
  en: {
    title: 'Book slots', names: "Who's playing?", review: 'Check it over', success: 'Booked!',
    steps: ['How many', 'Players', 'Check'], stepLabel: 'Step {step} of 3',
    loading: 'Loading session…', unavailable: 'This session cannot be booked.', retry: 'Try again',
    howMany: 'How many people are playing?', fewer: 'Fewer', more: 'More', left: '{count} slots left',
    pricePerSlot: 'Price per slot', slots: '{count} slots', total: 'Total', totalFor: 'Total, {count} slots',
    continue: 'Continue', signIn: 'Log in first', nameHint: 'These names are saved with the booking and seen by other players. You can change them.',
    player: 'Player {n}', you: '(you)', previous: 'Previous', next: 'Next',
    date: 'Date', venue: 'Venue', players: 'Players ({count})', editPlayers: 'Edit players',
    holdTitle: 'Pay within 5 hours', holdBody: 'After that, your slots are released.',
    confirm: 'Confirm booking', working: 'Saving booking…', closed: 'Booking has closed or the session is full.',
    safe: 'Your {count} slots are held until the payment deadline.', timeLeft: '{h} hours {m} minutes left to pay', hours: 'hours', minutes: 'min',
    payBy: 'Pay by', payTitle: 'How to pay (QRIS or transfer)', payBody: 'Payment details will appear here. For now, contact the club admin.',
    backToSchedule: 'Back to schedule', back: 'Back', backToScheduleLabel: 'Back to schedule',
  },
}

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}

function reservationKey(customerId: string, sessionId: string) { return `lafu.booking-draft.${customerId}.${sessionId}` }

// The task band: back, the step's question as the headline, and the three-step bar (current step in lime).
function TaskBand({ title, step, steps, stepLabel, backTo, onBack, backLabel, heading }: {
  title: string; step: number; steps: string[]; stepLabel: string; backTo?: string; onBack?: () => void; backLabel: string; heading: React.Ref<HTMLHeadingElement>
}) {
  const backClass = 'state-layer pressable flex size-12 shrink-0 items-center justify-center rounded-full bg-band-tile'
  return (
    <header className="rounded-b-lg bg-band pb-4 pt-[env(safe-area-inset-top)] text-on-signboard [&_:focus-visible]:outline-white">
      <div className="page-gutter mx-auto flex w-full max-w-3xl flex-col gap-4 pt-4">
        <div className="flex items-center gap-3">
          {onBack
            ? <button type="button" onClick={onBack} aria-label={backLabel} className={backClass}><ChevronLeft aria-hidden="true" className="size-6" /></button>
            : <Link to={backTo ?? '/'} aria-label={backLabel} className={backClass}><ChevronLeft aria-hidden="true" className="size-6" /></Link>}
          <h1 ref={heading} tabIndex={-1} className="min-w-0 text-headline font-bold focus:outline-none">{title}</h1>
        </div>
        <ol aria-label={stepLabel} className="grid grid-cols-3 gap-1.5">
          {steps.map((label, index) => {
            const position = index + 1
            const current = position === step
            const done = position < step
            return (
              <li key={label} aria-current={current ? 'step' : undefined}
                className={cn('flex h-9 items-center justify-center gap-1 rounded-xs text-label transition-colors duration-200', current ? 'bg-accent font-semibold text-on-accent' : 'bg-band-tile')}>
                {done && <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />}
                {label}
              </li>
            )
          })}
        </ol>
      </div>
    </header>
  )
}

// Pinned to the bottom while booking: what it costs and the one action that moves the booking forward.
function ActionBar({ caption, amount, children }: { caption: string; amount: string; children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 mt-auto rounded-t-lg border-t border-outline-variant bg-surface-container-lowest pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-bar">
      <div className="page-gutter mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
        <p className="flex min-w-0 flex-col leading-tight">
          <span className="text-label text-on-surface-variant">{caption}</span>
          <span className="text-title font-bold tabular-nums">{amount}</span>
        </p>
        {children}
      </div>
    </div>
  )
}

function SessionSummary({ session, language }: { session: PublicSessionDetail; language: 'id' | 'en' }) {
  return (
    <section aria-label={session.className} className="flex items-center gap-3 rounded-sm bg-surface-container-lowest p-3.5">
      <Scoreboard time={session.startTime} size="sm" />
      <p className="flex min-w-0 flex-col leading-snug">
        <span className="truncate font-semibold">{session.className}</span>
        <span className="truncate text-label text-on-surface-variant">{formatClubDateMedium(session.date, language)} · {session.venueName}</span>
      </p>
    </section>
  )
}

export function Component() {
  const { sessionId = '' } = useParams()
  const [query, setQuery] = useSearchParams()
  const navigate = useNavigate()
  const access = useCustomerAccess()
  const activeSession = access.state.stage === 'complete' ? access.state.session : null
  const { language } = useI18n()
  const text = messages[language]
  const reduceMotion = useReducedMotion()
  const now = useNow(30_000)
  const [session, setSession] = useState<PublicSessionDetail | null>(null)
  const [options, setOptions] = useState<Options | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [quantity, setQuantity] = useState(() => Math.max(1, Number(query.get('quantity')) || 1))
  const [names, setNames] = useState<string[]>([])
  const [step, setStep] = useState(1)
  const [page, setPage] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CreatedBooking | null>(null)
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const heading = useRef<HTMLHeadingElement>(null)
  const returnTo = `/book/${encodeURIComponent(sessionId)}?${new URLSearchParams({ ...(query.get('date') ? { date: query.get('date')! } : {}), quantity: String(quantity) })}`
  const schedulePath = query.get('date') ? `/?date=${encodeURIComponent(query.get('date')!)}` : '/'

  useEffect(() => {
    const controller = new AbortController()
    void fetch(`/api/public/sessions/${encodeURIComponent(sessionId)}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('session unavailable'); return response.json() as Promise<PublicSessionDetail> })
      .then(value => { if (!controller.signal.aborted) setSession(value) })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true) })
    return () => controller.abort()
  }, [sessionId])

  useEffect(() => {
    if (!activeSession) return
    const controller = new AbortController()
    void customerRequest<Options>(`/api/customer/booking-options/${encodeURIComponent(sessionId)}`, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setOptions(value) })
      .catch(value => {
        if (controller.signal.aborted) return
        if (value instanceof CustomerApiError && value.status === 401) {
          navigate(`/customer/sign-in?returnTo=${encodeURIComponent(returnTo)}`, { replace: true })
          return
        }
        if (value instanceof CustomerApiError) setError(value.detail.code)
      })
    return () => controller.abort()
  }, [activeSession, sessionId, navigate, returnTo])

  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [step, result])

  const currentOptions = options ?? (session ? { sessionVersion: session.version, unitPriceIdr: session.priceIdr, remainingPlaces: session.remainingPlaces, canReserve: session.availability !== 'cancelled' && session.remainingPlaces > 0 } : null)
  const total = currentOptions ? currentOptions.unitPriceIdr * quantity : 0
  const maximum = Math.max(1, currentOptions?.remainingPlaces ?? session?.remainingPlaces ?? 1)
  const pageCount = Math.max(1, Math.ceil(names.length / 10))
  const visibleNames = names.slice(page * 10, page * 10 + 10)

  function changeQuantity(value: number) {
    if (!Number.isSafeInteger(value) || value < 1) return
    value = Math.min(value, maximum)
    setQuantity(value)
    setNames(previous => Array.from({ length: value }, (_, index) => previous[index] ?? (activeSession ? (index === 0 ? activeSession.customer.displayName : `${activeSession.customer.displayName} ${index + 1}`) : '')))
    setRequestId(crypto.randomUUID())
    query.set('quantity', String(value)); setQuery(query, { replace: true })
  }

  function updateName(index: number, value: string) {
    setNames(previous => previous.map((name, position) => position === index ? value : name))
    setRequestId(crypto.randomUUID())
    if (activeSession) {
      try { sessionStorage.setItem(reservationKey(activeSession.customer.id, sessionId), JSON.stringify(names.map((name, position) => position === index ? value : name))) } catch { /* Draft remains in this page if storage is unavailable. */ }
    }
  }

  function startNames() {
    if (access.state.stage !== 'complete' || !activeSession) {
      navigate(`/customer/sign-in?returnTo=${encodeURIComponent(returnTo)}`)
      return
    }
    // Default names follow BOOK-02: the booker, then "Andy 2", "Andy 3"; a saved draft for the same count wins.
    const defaultNames = Array.from({ length: quantity }, (_, index) => index === 0 ? activeSession.customer.displayName : `${activeSession.customer.displayName} ${index + 1}`)
    try {
      const saved = sessionStorage.getItem(reservationKey(activeSession.customer.id, sessionId))
      const parsed = saved ? JSON.parse(saved) as unknown : null
      setNames(Array.isArray(parsed) && parsed.length === quantity && parsed.every(name => typeof name === 'string') ? parsed as string[] : defaultNames)
    } catch { setNames(defaultNames) }
    setStep(2)
  }

  function reviewNames() {
    const normalized = names.map(normalizeCustomerName)
    if (normalized.some(name => !name)) return
    const confirmedNames = normalized as string[]
    setNames(confirmedNames)
    if (activeSession) {
      try { sessionStorage.setItem(reservationKey(activeSession.customer.id, sessionId), JSON.stringify(confirmedNames)) } catch { /* Draft remains in this page if storage is unavailable. */ }
    }
    setStep(3)
  }

  async function confirm() {
    if (access.state.stage !== 'complete' || !options || pending) return
    setPending(true); setError(null)
    try {
      const created = await customerRequest<CreatedBooking>('/api/customer/bookings', {
        csrfToken: access.state.session.csrfToken,
        body: { sessionId, quantity, participantNames: names, expectedSessionVersion: options.sessionVersion, createRequestId: requestId },
      })
      setResult(created)
      try { sessionStorage.removeItem(reservationKey(access.state.session.customer.id, sessionId)) } catch { /* No persisted draft to clear. */ }
    } catch (failure) {
      setError(failure instanceof CustomerApiError ? failure.detail.code : 'INTERNAL')
      if (failure instanceof CustomerApiError && ['CAPACITY_UNAVAILABLE', 'SESSION_CHANGED'].includes(failure.detail.code)) {
        try { setOptions(await customerRequest<Options>(`/api/customer/booking-options/${encodeURIComponent(sessionId)}`)) } catch { /* Keep entered names visible. */ }
      }
    } finally { setPending(false) }
  }

  const errorMessage = error && error in apiErrorMessages ? apiErrorMessages[error as keyof typeof apiErrorMessages][language] : null
  const stepMotion = { initial: { opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : 12 }, animate: { opacity: 1, x: 0 }, transition: { duration: reduceMotion ? 0 : 0.18 } }

  if (result && session) {
    const deadline = Date.parse(result.booking.originalDeadline)
    const minutesLeft = Math.max(0, Math.floor((deadline - now) / 60_000))
    const hoursLeft = Math.floor(minutesLeft / 60)
    const cell = 'flex size-16 items-center justify-center rounded-xs bg-ink text-headline font-bold tabular-nums text-accent'
    return (
      <div className="flex min-h-dvh flex-col">
        <header className="rounded-b-lg bg-accent pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-on-accent">
          <div className="page-gutter mx-auto flex w-full max-w-3xl flex-col items-center gap-2.5 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-ink text-accent"><Check aria-hidden="true" className="size-7" strokeWidth={2.5} /></span>
            <h1 ref={heading} tabIndex={-1} className="text-headline font-bold focus:outline-none">{text.success}</h1>
            <p>{fill(text.safe, { count: result.booking.quantity })}</p>
            <div role="timer" aria-label={fill(text.timeLeft, { h: hoursLeft, m: minutesLeft % 60 })} className="mt-1 flex items-start gap-1.5">
              <span className="flex flex-col items-center gap-1"><span aria-hidden="true" className={cell}>{String(hoursLeft).padStart(2, '0')}</span><span aria-hidden="true" className="text-label">{text.hours}</span></span>
              <span aria-hidden="true" className="text-headline font-bold leading-[4rem]">:</span>
              <span className="flex flex-col items-center gap-1"><span aria-hidden="true" className={cell}>{String(minutesLeft % 60).padStart(2, '0')}</span><span aria-hidden="true" className="text-label">{text.minutes}</span></span>
            </div>
            <p className="text-label">{text.payBy} <span className="font-semibold">{new Date(deadline).toLocaleString(language === 'id' ? 'id-ID' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB</span></p>
          </div>
        </header>
        <div className="page-gutter mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
          <section aria-label={session.className} className="flex flex-col gap-2 rounded-sm bg-surface-container-lowest p-4">
            <div className="flex flex-wrap justify-between gap-x-3"><span className="font-semibold">{session.className}</span><span className="tabular-nums">{formatClubDateMedium(session.date, language)}, {formatClubTime(session.startsAt)}</span></div>
            <p className="text-label text-on-surface-variant">{result.booking.participants.map(participant => participant.name).join(', ')}</p>
            <div className="flex justify-between gap-3 border-t border-outline-variant pt-2"><span className="text-on-surface-variant">{text.total}</span><span className="font-bold tabular-nums">{formatIdr(result.booking.totalPriceIdr, language)}</span></div>
          </section>
          <section aria-label={text.payTitle} className="rounded-sm border border-dashed border-outline p-4 text-label">
            <p className="font-semibold text-on-surface">{text.payTitle}</p>
            <p className="mt-0.5 text-on-surface-variant">{text.payBody}</p>
          </section>
          <Button asChild variant="outlined" className="mt-auto min-h-14"><Link to={schedulePath}>{text.backToSchedule}</Link></Button>
        </div>
      </div>
    )
  }

  const title = step === 1 ? text.title : step === 2 ? text.names : text.review
  const band = <TaskBand title={title} step={step} steps={text.steps} stepLabel={fill(text.stepLabel, { step })} heading={heading} backLabel={step === 1 ? text.backToScheduleLabel : text.back}
    backTo={step === 1 ? schedulePath : undefined} onBack={step === 1 ? undefined : () => setStep(step - 1)} />

  if (loadError || !session) {
    return (
      <div className="flex min-h-dvh flex-col">
        {band}
        <div className="page-gutter mx-auto w-full max-w-3xl pt-4">
          {loadError
            ? <StatusPanel tone="error" title={text.unavailable} action={{ label: text.retry, onAction: () => { setLoadError(false); setSession(null); window.location.reload() } }} />
            : <p role="status">{text.loading}</p>}
        </div>
      </div>
    )
  }

  const canContinue = Boolean(currentOptions?.canReserve) && quantity <= (currentOptions?.remainingPlaces ?? 0)
  const amount = formatIdr(total, language)

  return (
    <div className="flex min-h-dvh flex-col">
      {band}
      <m.div key={step} {...stepMotion} className="page-gutter mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-4 pb-6 pt-4">
        {step === 1 && <>
          <SessionSummary session={session} language={language} />
          <section aria-labelledby="how-many" className="flex flex-col items-center gap-3.5 rounded-sm bg-surface-container-lowest px-4 py-5">
            <h2 id="how-many" className="text-title font-semibold">{text.howMany}</h2>
            <div className="flex items-center gap-6">
              <button type="button" aria-label={text.fewer} disabled={quantity <= 1} onClick={() => changeQuantity(quantity - 1)}
                className="state-layer pressable flex size-14 items-center justify-center rounded-sm border border-outline text-on-surface disabled:opacity-40">
                <Minus aria-hidden="true" className="size-6" strokeWidth={2.5} />
              </button>
              <output aria-live="polite" className="min-w-16 text-center text-display font-bold tabular-nums">{quantity}</output>
              <button type="button" aria-label={text.more} disabled={quantity >= maximum} onClick={() => changeQuantity(quantity + 1)}
                className="state-layer pressable flex size-14 items-center justify-center rounded-sm bg-cta text-on-cta disabled:opacity-40">
                <Plus aria-hidden="true" className="size-6" strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-label font-semibold text-primary">{fill(text.left, { count: currentOptions?.remainingPlaces ?? session.remainingPlaces })}</p>
          </section>
          <dl className="rounded-sm bg-surface-container-lowest px-4">
            <div className="flex justify-between gap-3 border-b border-outline-variant py-2.5"><dt className="text-on-surface-variant">{text.pricePerSlot}</dt><dd className="tabular-nums">{formatIdr(currentOptions?.unitPriceIdr ?? session.priceIdr, language)}</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt className="text-on-surface-variant">{fill(text.slots, { count: quantity })}</dt><dd className="font-semibold tabular-nums">{amount}</dd></div>
          </dl>
          {!currentOptions?.canReserve && <StatusPanel tone="info" title={text.closed} />}
          {errorMessage && <StatusPanel tone="error" title={errorMessage} />}
        </>}

        {step === 2 && <>
          <p className="text-on-surface-variant">{text.nameHint}</p>
          <div className="grid gap-4 sm:grid-cols-2">{visibleNames.map((name, localIndex) => {
            const index = page * 10 + localIndex
            return <TextField key={index} name={`participant-${index}`} label={`${fill(text.player, { n: index + 1 })}${index === 0 ? ' ' + text.you : ''}`}
              autoComplete={index === 0 ? 'name' : 'off'} maxLength={120} value={name} leading={<UserRound className="size-5" />}
              onChange={event => updateName(index, event.target.value)} required />
          })}</div>
          {pageCount > 1 && <nav aria-label={text.names} className="flex items-center justify-between gap-3">
            <Button variant="outlined" disabled={page === 0} onClick={() => setPage(value => value - 1)}>{text.previous}</Button>
            <span className="tabular-nums">{page + 1} / {pageCount}</span>
            <Button variant="outlined" disabled={page + 1 === pageCount} onClick={() => setPage(value => value + 1)}>{text.next}</Button>
          </nav>}
        </>}

        {step === 3 && <>
          <section aria-label={session.className} className="rounded-sm bg-surface-container-lowest px-4 pb-1 pt-3.5">
            <div className="flex items-center gap-3 border-b border-outline-variant pb-3">
              <Scoreboard time={session.startTime} size="sm" />
              <p className="flex min-w-0 flex-col leading-snug"><span className="font-semibold">{session.className}</span><span className="text-label text-on-surface-variant">{session.levelName}</span></p>
            </div>
            <dl>
              <div className="flex justify-between gap-4 border-b border-outline-variant py-2.5"><dt className="text-label text-on-surface-variant">{text.date}</dt><dd className="text-right">{formatClubDateLong(session.date, language)}</dd></div>
              <div className="flex justify-between gap-4 border-b border-outline-variant py-2.5"><dt className="text-label text-on-surface-variant">{text.venue}</dt><dd className="text-right">{session.venueName}</dd></div>
              <div className="flex justify-between gap-4 py-2.5"><dt className="text-label text-on-surface-variant">{fill(text.players, { count: names.length })}</dt>
                <dd className="min-w-0 text-right"><ol className="flex flex-col">{names.map((name, index) => <li key={index} className="break-words">{name}</li>)}</ol></dd></div>
            </dl>
            <Button variant="text" className="-ml-3" onClick={() => setStep(2)}>{text.editPlayers}</Button>
          </section>
          <section aria-label={text.holdTitle} className="flex gap-3 rounded-sm bg-ink p-3.5 text-on-ink">
            <Clock aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-accent" />
            <p className="text-label"><span className="block text-body font-semibold text-accent">{text.holdTitle}</span>{text.holdBody}</p>
          </section>
          {errorMessage && <StatusPanel tone="error" title={errorMessage} />}
        </>}
      </m.div>

      <ActionBar caption={step === 1 ? text.total : fill(text.totalFor, { count: quantity })} amount={amount}>
        {step === 1 && <Button variant="filled" className="px-8" disabled={!canContinue} onClick={startNames}>{activeSession ? text.continue : text.signIn}</Button>}
        {step === 2 && <Button variant="filled" className="px-8" onClick={reviewNames} disabled={names.length !== quantity || names.some(name => !normalizeCustomerName(name))}>{text.continue}</Button>}
        {step === 3 && <Button variant="filled" className="px-5" disabled={pending || !options?.canReserve || !options} pendingLabel={pending ? text.working : undefined} onClick={() => void confirm()}>{text.confirm}</Button>}
      </ActionBar>
    </div>
  )
}
