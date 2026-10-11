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
import { setNavMotion } from '@/lib/nav-motion'
import type { PublicSessionDetail } from '@shared/api/public'
import { normalizeCustomerName } from '@shared/customer-rules'
import { CustomerApiError, customerRequest } from '@/lib/customer-api'
import { useMediaQuery } from '@/lib/use-media-query'
import { useNow } from '@/features/public/schedule/use-now'
import { useCustomerAccess } from '../auth/use-customer-access'
import { CourtLines } from '@/components/brand/court-lines'
import { BookedArt } from './BookedArt'

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
    seeBooking: 'Lihat booking', backToSchedule: 'Kembali ke jadwal', back: 'Kembali', backToScheduleLabel: 'Kembali ke jadwal',
    unpaid: 'Belum bayar', people: 'orang', quickPick: 'Pilih cepat', summary: 'Ringkasan', changeSession: 'Ganti sesi', priceTimes: '{price} × {count} orang',
    seatsLabel: '{taken} udah diambil, {mine} buat kamu, {open} masih kosong, dari {max} slot', taken: '{count} udah diambil', mine: '{count} buat kamu', open: '{count} masih kosong',
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
    seeBooking: 'See booking', backToSchedule: 'Back to schedule', back: 'Back', backToScheduleLabel: 'Back to schedule',
    unpaid: 'Not paid yet', people: 'people', quickPick: 'Quick pick', summary: 'Summary', changeSession: 'Change session', priceTimes: '{price} × {count} people',
    seatsLabel: '{taken} taken, {mine} for you, {open} still open, of {max} places', taken: '{count} taken', mine: '{count} for you', open: '{count} still open',
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
    <header className="rounded-b-lg bg-band pb-4 pt-[env(safe-area-inset-top)] text-on-signboard [view-transition-name:app-bar] [&_:focus-visible]:outline-white desk-column lg:mt-5 lg:rounded-lg lg:py-4">
      {/* Desktop: one compact row, back and title on the left, the three steps on the right. */}
      <div className="page-gutter mx-auto flex w-full max-w-3xl flex-col gap-4 pt-4 lg:max-w-none lg:flex-row lg:items-center lg:justify-between lg:px-5 lg:pt-0">
        <div className="flex items-center gap-3">
          {onBack
            ? <button type="button" onClick={onBack} aria-label={backLabel} className={backClass}><ChevronLeft aria-hidden="true" className="size-6" /></button>
            : <Link to={backTo ?? '/schedule'} viewTransition data-nav="pop" aria-label={backLabel} className={backClass}><ChevronLeft aria-hidden="true" className="size-6" /></Link>}
          <h1 ref={heading} tabIndex={-1} className="min-w-0 text-headline font-bold focus:outline-none">{title}</h1>
        </div>
        <ol aria-label={stepLabel} className="grid grid-cols-3 gap-1.5 lg:flex">
          {steps.map((label, index) => {
            const position = index + 1
            const current = position === step
            const done = position < step
            return (
              <li key={label} aria-current={current ? 'step' : undefined}
                className={cn('flex h-9 items-center justify-center gap-1 rounded-xs text-label transition-colors duration-200 lg:h-12 lg:rounded-full lg:px-5', current ? 'bg-accent font-semibold text-on-accent' : 'bg-band-tile')}>
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

// Desktop step 1: one tap to a common group size, up to the places left.
function QuickPick({ quantity, maximum, label, onPick }: { quantity: number; maximum: number; label: string; onPick: (value: number) => void }) {
  const choices = [1, 2, 3, 4, 5].filter(value => value <= maximum)
  if (choices.length < 2) return null
  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {choices.map(value => (
        <button key={value} type="button" aria-pressed={value === quantity} onClick={() => onPick(value)}
          className={cn('state-layer pressable size-12 rounded-full text-title font-bold tabular-nums', value === quantity ? 'bg-primary text-on-primary' : 'border border-outline-variant text-on-surface')}>{value}</button>
      ))}
    </div>
  )
}

// Desktop step 1: the session's places drawn as seats (taken, yours, still open), so the count has a picture.
function Seats({ max, remaining, mine, text }: { max: number; remaining: number; mine: number; text: typeof messages.id }) {
  if (!Number.isSafeInteger(max) || max < 1 || max > 24) return null
  const taken = Math.max(0, max - remaining)
  const open = Math.max(0, remaining - mine)
  return (
    <div className="flex w-full max-w-[32rem] flex-col items-center gap-3 border-t border-outline-variant pt-5">
      <div role="img" aria-label={fill(text.seatsLabel, { taken, mine, open, max })} className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: max }, (_, index) => (
          <span key={index} className={cn('h-10 w-8 rounded-xs transition-colors duration-200', index < taken ? 'bg-outline-variant' : index < taken + mine ? 'bg-primary' : 'border-2 border-primary/30')} />
        ))}
      </div>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-label text-on-surface-variant">
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="size-3 rounded-[3px] bg-outline-variant" />{fill(text.taken, { count: taken })}</li>
        <li className="flex items-center gap-1.5 font-semibold text-on-surface"><span aria-hidden="true" className="size-3 rounded-[3px] bg-primary" />{fill(text.mine, { count: mine })}</li>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="size-3 rounded-[3px] border-2 border-primary/30" />{fill(text.open, { count: open })}</li>
      </ul>
    </div>
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
  const isDesktop = useMediaQuery('(min-width: 64rem)')
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
  const schedulePath = query.get('date') ? `/schedule?date=${encodeURIComponent(query.get('date')!)}` : '/schedule'

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
      setNavMotion('push')
      navigate(`/customer/sign-in?returnTo=${encodeURIComponent(returnTo)}`, { viewTransition: true })
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
    const cell = 'flex size-16 items-center justify-center rounded-xs bg-band-tile text-headline font-bold tabular-nums'
    const rise = (delay: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.42, ease: 'easeOut' as const } })
    const payBy = new Date(deadline).toLocaleString(language === 'id' ? 'id-ID' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
    // Desktop (board D3): the moment on the left in Court Blue, what was booked on a white card to the right.
    if (isDesktop) {
      return (
        <div className="page-gutter desk-column mx-auto w-full py-5">
          <section className="relative isolate flex flex-wrap items-center gap-10 overflow-hidden rounded-lg bg-band p-[clamp(2rem,4vw,3.5rem)] text-on-signboard [&_:focus-visible]:outline-white">
            <CourtLines className="pointer-events-none absolute -right-10 -top-12 -z-10 h-[26rem] text-on-signboard/15" />
            <div className="flex min-w-0 flex-[1_1_22rem] flex-col gap-5">
              <m.span initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                aria-hidden="true" className="flex size-18 items-center justify-center rounded-full bg-surface-container-lowest text-primary">
                <Check className="size-9" strokeWidth={3} />
              </m.span>
              <div className="flex flex-col gap-1.5">
                <h1 ref={heading} tabIndex={-1} className="text-display font-bold focus:outline-none">{text.success}</h1>
                <p className="text-title font-normal">{fill(text.safe, { count: result.booking.quantity })}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span role="timer" aria-label={fill(text.timeLeft, { h: hoursLeft, m: minutesLeft % 60 })} className="flex items-baseline gap-1.5 rounded-sm bg-band-tile px-4 py-3 tabular-nums">
                  <span aria-hidden="true" className="text-display font-bold leading-none">{String(hoursLeft).padStart(2, '0')}</span><span aria-hidden="true" className="text-label">{text.hours}</span>
                  <span aria-hidden="true" className="text-display font-bold leading-none">{String(minutesLeft % 60).padStart(2, '0')}</span><span aria-hidden="true" className="text-label">{text.minutes}</span>
                </span>
                <span className="flex flex-col leading-snug"><span className="text-label">{text.payBy}</span><span className="text-title font-bold">{payBy} WIB</span></span>
              </div>
              <p className="max-w-[32rem] rounded-sm bg-band-tile px-4 py-3 text-label"><span className="font-semibold">{text.payTitle}. </span>{text.payBody}</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="filled" className="min-h-14 px-7"><Link to={`/bookings/${result.booking.id}`} viewTransition data-nav="push">{text.seeBooking}</Link></Button>
                <Button asChild variant="tonal" className="min-h-14 bg-surface-container-lowest px-7 text-primary"><Link to={schedulePath} viewTransition data-nav="pop">{text.backToSchedule}</Link></Button>
              </div>
            </div>
            <section aria-label={session.className} className="flex min-w-0 max-w-[26rem] flex-[1_1_20rem] flex-col gap-3.5 rounded-md bg-surface-container-lowest p-6 text-on-surface">
              <span className="self-start rounded-full bg-warning-container px-3 py-0.5 text-label font-semibold text-warning">{text.unpaid}</span>
              <span className="flex flex-col leading-snug">
                <span className="break-words text-title font-bold">{session.className}</span>
                <span className="text-label text-on-surface-variant">{formatClubDateMedium(session.date, language)} · {session.startTime}-{session.endTime} WIB</span>
              </span>
              <ul className="flex flex-wrap gap-1.5">{result.booking.participants.map(participant => <li key={participant.id} className="rounded-full bg-surface-container px-3 py-1 text-label">{participant.name}</li>)}</ul>
              <span className="flex justify-between gap-3 border-t border-outline-variant pt-3"><span className="text-on-surface-variant">{text.total}</span><span className="font-bold tabular-nums">{formatIdr(result.booking.totalPriceIdr, language)}</span></span>
            </section>
          </section>
        </div>
      )
    }
    // Court Blue with white text and the lime action, per the club owner's review; the art plays the moment once.
    return (
      <div className="flex min-h-dvh flex-col bg-band text-on-signboard [&_:focus-visible]:outline-white">
        <div className="page-gutter mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
          <BookedArt />
          <m.div {...rise(0.7)} className="flex flex-col gap-2 text-center">
            <h1 ref={heading} tabIndex={-1} className="text-display font-bold focus:outline-none">{text.success}</h1>
            <p className="text-title font-normal">{fill(text.safe, { count: result.booking.quantity })}</p>
          </m.div>
          <m.div {...rise(0.82)} className="flex flex-col items-center gap-2.5">
            <div role="timer" aria-label={fill(text.timeLeft, { h: hoursLeft, m: minutesLeft % 60 })} className="flex items-center gap-2">
              <span aria-hidden="true" className={cell}>{String(hoursLeft).padStart(2, '0')}</span>
              <span aria-hidden="true" className="text-headline font-bold">:</span>
              <span aria-hidden="true" className={cell}>{String(minutesLeft % 60).padStart(2, '0')}</span>
            </div>
            <p className="rounded-full bg-band-tile px-3.5 py-1.5 text-label">{text.payBy} <span className="font-semibold">{payBy} WIB</span></p>
          </m.div>
          <m.section {...rise(0.94)} aria-label={session.className} className="flex flex-col gap-1.5 rounded-sm bg-surface-container-lowest p-4 text-on-surface">
            <div className="flex flex-wrap justify-between gap-x-3"><span className="font-semibold">{session.className}</span><span className="tabular-nums">{formatClubDateMedium(session.date, language)}, {formatClubTime(session.startsAt)}</span></div>
            <p className="text-label text-on-surface-variant">{result.booking.participants.map(participant => participant.name).join(', ')}</p>
            <div className="flex justify-between gap-3 border-t border-outline-variant pt-2"><span className="text-on-surface-variant">{text.total}</span><span className="font-bold tabular-nums">{formatIdr(result.booking.totalPriceIdr, language)}</span></div>
          </m.section>
          <m.section {...rise(0.94)} aria-label={text.payTitle} className="rounded-sm bg-band-tile p-4 text-label">
            <p className="font-semibold">{text.payTitle}</p>
            <p className="mt-0.5">{text.payBody}</p>
          </m.section>
          <div className="mt-auto flex flex-col gap-2">
            <Button asChild variant="filled" className="min-h-14"><Link to={`/bookings/${result.booking.id}`} viewTransition data-nav="push">{text.seeBooking}</Link></Button>
            <Button asChild variant="text" className="text-on-signboard"><Link to={schedulePath} viewTransition data-nav="pop">{text.backToSchedule}</Link></Button>
          </div>
        </div>
      </div>
    )
  }

  // Desktop keeps "Pesan slot" in the band; the step's question heads its card instead.
  const title = step === 1 || isDesktop ? text.title : step === 2 ? text.names : text.review
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
  const action = step === 1 ? <Button variant="filled" className="px-8 lg:min-h-14 lg:w-full" disabled={!canContinue} onClick={startNames}>{activeSession ? text.continue : text.signIn}</Button>
    : step === 2 ? <Button variant="filled" className="px-8 lg:min-h-14 lg:w-full" onClick={reviewNames} disabled={names.length !== quantity || names.some(name => !normalizeCustomerName(name))}>{text.continue}</Button>
    : <Button variant="filled" className="px-5 lg:min-h-14 lg:w-full" disabled={pending || !options?.canReserve || !options} pendingLabel={pending ? text.working : undefined} onClick={() => void confirm()}>{text.confirm}</Button>
  const unitPrice = currentOptions?.unitPriceIdr ?? session.priceIdr
  const remaining = currentOptions?.remainingPlaces ?? session.remainingPlaces

  return (
    <div className="flex min-h-dvh flex-col">
      {band}
      {/* Desktop: the step in a card beside the summary card, tops and bottoms aligned. */}
      <div className="page-gutter desk-column mx-auto flex w-full max-w-3xl min-w-0 flex-col lg:flex-row lg:items-stretch lg:gap-5 lg:pb-12 lg:pt-5">
      <m.div key={step} {...stepMotion} className="flex min-w-0 flex-1 flex-col gap-4 pb-6 pt-4 lg:rounded-lg lg:bg-surface-container-lowest lg:p-8">
        {step === 1 && <>
          {!isDesktop && <SessionSummary session={session} language={language} />}
          <section aria-labelledby="how-many" className="flex flex-col items-center gap-3.5 rounded-sm bg-surface-container-lowest px-4 py-5 lg:flex-1 lg:justify-center lg:gap-6 lg:p-0">
            <h2 id="how-many" className="text-title font-semibold lg:text-headline lg:font-bold">{text.howMany}</h2>
            <div className="flex items-center gap-6">
              <button type="button" aria-label={text.fewer} disabled={quantity <= 1} onClick={() => changeQuantity(quantity - 1)}
                className="state-layer pressable flex size-14 items-center justify-center rounded-sm border border-outline text-on-surface disabled:opacity-40">
                <Minus aria-hidden="true" className="size-6" strokeWidth={2.5} />
              </button>
              <span className="flex min-w-16 flex-col items-center lg:min-w-30">
                <output aria-live="polite" className="text-center text-display font-bold tabular-nums lg:text-poster">{quantity}</output>
                {isDesktop && <span className="font-semibold text-on-surface-variant">{text.people}</span>}
              </span>
              <button type="button" aria-label={text.more} disabled={quantity >= maximum} onClick={() => changeQuantity(quantity + 1)}
                className="state-layer pressable flex size-14 items-center justify-center rounded-sm bg-primary text-on-primary disabled:opacity-40">
                <Plus aria-hidden="true" className="size-6" strokeWidth={2.5} />
              </button>
            </div>
            {isDesktop ? <>
              <QuickPick quantity={quantity} maximum={maximum} label={text.quickPick} onPick={changeQuantity} />
              <Seats max={session.maxParticipants} remaining={remaining} mine={quantity} text={text} />
            </> : <p className="text-label font-semibold text-primary">{fill(text.left, { count: remaining })}</p>}
          </section>
          <dl className="rounded-sm bg-surface-container-lowest px-4 lg:hidden">
            <div className="flex justify-between gap-3 border-b border-outline-variant py-2.5"><dt className="text-on-surface-variant">{text.pricePerSlot}</dt><dd className="tabular-nums">{formatIdr(currentOptions?.unitPriceIdr ?? session.priceIdr, language)}</dd></div>
            <div className="flex justify-between gap-3 py-2.5"><dt className="text-on-surface-variant">{fill(text.slots, { count: quantity })}</dt><dd className="font-semibold tabular-nums">{amount}</dd></div>
          </dl>
          {!currentOptions?.canReserve && <StatusPanel tone="info" title={text.closed} />}
          {errorMessage && <StatusPanel tone="error" title={errorMessage} />}
        </>}

        {step === 2 && <>
          {isDesktop && <h2 className="text-headline font-bold">{text.names}</h2>}
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
          {isDesktop && <h2 className="text-headline font-bold">{text.review}</h2>}
          <section aria-label={session.className} className="rounded-sm bg-surface-container-lowest px-4 pb-1 pt-3.5 lg:border lg:border-outline-variant">
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
          <section aria-label={text.holdTitle} className="flex gap-3 rounded-sm bg-primary-container p-3.5 text-on-primary-container">
            <Clock aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
            <p className="text-label"><span className="block text-body font-semibold text-primary">{text.holdTitle}</span>{text.holdBody}</p>
          </section>
          {errorMessage && <StatusPanel tone="error" title={errorMessage} />}
        </>}
      </m.div>
      {isDesktop && (
        <aside aria-label={text.summary} className="flex w-[22rem] shrink-0 flex-col overflow-hidden rounded-lg bg-surface-container-lowest xl:w-[24rem]">
          <div className="relative h-36 bg-band-tile">
            <img src="/photos/club-schedule.webp" alt="" className="size-full object-cover" />
            <span className="absolute bottom-4 left-4 rounded-xs bg-band-tile px-3 py-1.5 text-title font-bold tabular-nums text-on-signboard">{session.startTime}</span>
          </div>
          <div className="flex flex-col gap-1 px-5 pb-1 pt-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="break-words text-title font-bold">{session.className}</h2>
              <Link to={schedulePath} viewTransition data-nav="pop" className="flex min-h-12 shrink-0 items-center text-label font-semibold text-primary">{text.changeSession}</Link>
            </div>
            <p className="text-on-surface-variant">{formatClubDateMedium(session.date, language)} · {session.startTime}-{session.endTime} · {session.venueName}</p>
          </div>
          <dl className="mt-auto flex flex-col px-5 py-3">
            <div className="flex justify-between gap-4 py-2"><dt className="text-on-surface-variant">{fill(text.priceTimes, { price: formatIdr(unitPrice, language), count: quantity })}</dt><dd className="tabular-nums">{amount}</dd></div>
            <div className="flex items-baseline justify-between gap-4 border-t border-outline-variant pb-1 pt-3"><dt className="font-bold">{text.total}</dt><dd className="text-headline font-bold tabular-nums">{amount}</dd></div>
          </dl>
          <div className="px-5 pb-5 pt-1">{action}</div>
        </aside>
      )}
      </div>

      {!isDesktop && <ActionBar caption={step === 1 ? text.total : fill(text.totalFor, { count: quantity })} amount={amount}>{action}</ActionBar>}
    </div>
  )
}
