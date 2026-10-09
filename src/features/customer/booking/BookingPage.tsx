import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { m, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { IntegerField } from '@/components/ui/integer-field'
import { TextField } from '@/components/ui/text-field'
import { StatusPanel } from '@/components/ui/status-panel'
import { useI18n } from '@/i18n/use-i18n'
import { formatClubDateLong, formatClubTime, formatIdr } from '@/i18n/format'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import type { PublicSessionDetail } from '@shared/api/public'
import { normalizeCustomerName } from '@shared/customer-rules'
import { CustomerApiError, customerRequest } from '@/lib/customer-api'
import { useCustomerAccess } from '../auth/use-customer-access'

type Options = { sessionVersion: number; unitPriceIdr: number; remainingPlaces: number; bookingClosesAt: string; serverNow: string; canReserve: boolean }
type CreatedBooking = { booking: { id: string; quantity: number; totalPriceIdr: number; originalDeadline: string; participants: { id: string; position: number; name: string }[] }; replayed: boolean; serverNow: string }
const messages = {
  id: { title: 'Pilih tempat', loading: 'Memuat sesi…', unavailable: 'Sesi ini tidak dapat dipesan.', quantity: 'Jumlah peserta', continue: 'Lanjutkan', names: 'Nama peserta', nameHint: 'Nama ini akan tersimpan pada pemesanan.', back: 'Kembali', backToSchedule: 'Jadwal', backToScheduleLabel: 'Kembali ke jadwal', review: 'Periksa pemesanan', total: 'Total', confirm: 'Konfirmasi pemesanan', working: 'Menyimpan pemesanan…', success: 'Tempat berhasil dipesan', deadline: 'Bayar sebelum', places: 'tempat tersedia', signIn: 'Masuk dengan nomor telepon untuk melanjutkan', retry: 'Coba lagi', closed: 'Pemesanan sudah ditutup atau tempat telah penuh.', previous: 'Sebelumnya', next: 'Berikutnya', step: 'Langkah {step} dari 3', session: 'Sesi', date: 'Tanggal', perPlace: 'per orang' },
  en: { title: 'Choose places', loading: 'Loading session…', unavailable: 'This session cannot be reserved.', quantity: 'Number of players', continue: 'Continue', names: 'Player names', nameHint: 'These names will be saved with the reservation.', back: 'Back', backToSchedule: 'Schedule', backToScheduleLabel: 'Back to schedule', review: 'Review reservation', total: 'Total', confirm: 'Confirm reservation', working: 'Saving reservation…', success: 'Places reserved', deadline: 'Pay by', places: 'places available', signIn: 'Sign in with your phone to continue', retry: 'Try again', closed: 'Reservations are closed or the session is full.', previous: 'Previous', next: 'Next', step: 'Step {step} of 3', session: 'Session', date: 'Date', perPlace: 'per person' },
}

function reservationKey(customerId: string, sessionId: string) { return `lafu.booking-draft.${customerId}.${sessionId}` }

export function Component() {
  const { sessionId = '' } = useParams()
  const [query, setQuery] = useSearchParams()
  const navigate = useNavigate()
  const access = useCustomerAccess()
  const activeSession = access.state.stage === 'complete' ? access.state.session : null
  const { language } = useI18n()
  const text = messages[language]
  const reduceMotion = useReducedMotion()
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
  const pageCount = Math.max(1, Math.ceil(names.length / 10))
  const visibleNames = names.slice(page * 10, page * 10 + 10)
  function changeQuantity(value: number) {
    if (!Number.isSafeInteger(value) || value < 1) return
    const maximum = currentOptions?.remainingPlaces ?? session?.remainingPlaces ?? 1
    value = Math.min(value, Math.max(1, maximum))
    setQuantity(value)
    setNames(previous => Array.from({ length: value }, (_, index) => previous[index] ?? (index === 0 && activeSession ? activeSession.customer.displayName : `${text.names} ${index + 1}`)))
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
  const title = result ? text.success : step === 1 ? text.title : step === 2 ? text.names : text.review
  const date = session ? (language === 'id' ? formatClubDateLong(session.date, 'id') : formatClubDateLong(session.date, 'en')) : ''

  return <main className="page-gutter mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6 py-6 sm:py-8">
    <Button asChild variant="text" className="self-start"><Link to={query.get('date') ? `/?date=${encodeURIComponent(query.get('date')!)}` : '/'} aria-label={text.backToScheduleLabel}><ArrowLeft aria-hidden="true" className="size-5" />{text.backToSchedule}</Link></Button>
    <m.section key={result ? 'success' : step} initial={{ opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} className="flex min-w-0 flex-col gap-6">
      <div><p className="text-label text-primary">{!result && text.step.replace('{step}', String(step))}</p><h1 ref={heading} tabIndex={-1} className="text-headline font-bold text-on-surface">{title}</h1></div>
      {loadError ? <StatusPanel tone="error" title={text.unavailable} action={{ label: text.retry, onAction: () => { setLoadError(false); setSession(null); window.location.reload() } }} />
        : !session ? <p role="status">{text.loading}</p> : result ? <>
          <StatusPanel tone="success" title={text.success}>
            <p>{session.className} · {formatClubTime(session.startsAt)} · {result.booking.quantity} {text.places}</p>
            <p>{text.total}: {formatIdr(result.booking.totalPriceIdr, language)}</p>
            <p>{text.deadline}: {new Date(result.booking.originalDeadline).toLocaleString(language === 'id' ? 'id-ID' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </StatusPanel>
          <Button asChild variant="filled"><Link to="/">{language === 'id' ? 'Kembali ke jadwal' : 'Back to schedule'}</Link></Button>
        </> : <>
          <section className="rounded-lg border border-outline-variant bg-surface-container-low p-4 sm:p-5">
            <p className="text-label text-on-surface-variant">{text.session}</p><h2 className="text-title font-bold">{session.className} · {session.levelName}</h2>
            <p>{date} · {formatClubTime(session.startsAt)} · {session.venueName}</p>
            <p className="mt-2 font-bold">{formatIdr(currentOptions?.unitPriceIdr ?? session.priceIdr, language)} {text.perPlace}</p>
            <p>{currentOptions?.remainingPlaces ?? session.remainingPlaces} {text.places}</p>
          </section>
          {step === 1 && <div className="flex flex-col gap-5">
            <IntegerField name="quantity" label={text.quantity} min={1} max={currentOptions?.remainingPlaces ?? session.remainingPlaces} value={String(quantity)} onChange={event => changeQuantity(Number(event.target.value))} />
            <p className="font-bold">{text.total}: {formatIdr(total, language)}</p>
            <Button variant="filled" disabled={!currentOptions?.canReserve || quantity > currentOptions.remainingPlaces} onClick={() => {
              if (access.state.stage !== 'complete') navigate(`/customer/sign-in?returnTo=${encodeURIComponent(returnTo)}`)
              else if (activeSession) {
                const defaultNames = Array.from({ length: quantity }, (_, index) => index === 0 ? activeSession.customer.displayName : `${activeSession.customer.displayName} ${index + 1}`)
                try {
                  const saved = sessionStorage.getItem(reservationKey(activeSession.customer.id, sessionId))
                  const parsed = saved ? JSON.parse(saved) as unknown : null
                  setNames(Array.isArray(parsed) && parsed.length === quantity && parsed.every(name => typeof name === 'string') ? parsed as string[] : defaultNames)
                } catch { setNames(defaultNames) }
                setStep(2)
              }
            }}>{access.state.stage === 'complete' ? text.continue : text.signIn}</Button>
            {!currentOptions?.canReserve && <StatusPanel tone="info" title={text.closed} />}
          </div>}
          {step === 2 && <>
            <p className="text-body text-on-surface-variant">{text.nameHint}</p>
            <div className="grid gap-4 sm:grid-cols-2">{visibleNames.map((name, localIndex) => {
              const index = page * 10 + localIndex
              return <TextField key={index} name={`participant-${index}`} label={`${index + 1}. ${text.names}`} autoComplete={index === 0 ? 'name' : 'off'} maxLength={120} value={name}
                onChange={event => updateName(index, event.target.value)} required />
            })}</div>
            {pageCount > 1 && <nav aria-label={text.names} className="flex items-center justify-between gap-3"><Button variant="outlined" disabled={page === 0} onClick={() => setPage(value => value - 1)}>{text.previous}</Button><span>{page + 1} / {pageCount}</span><Button variant="outlined" disabled={page + 1 === pageCount} onClick={() => setPage(value => value + 1)}>{text.next}</Button></nav>}
            {errorMessage && <StatusPanel tone="error" title={errorMessage} />}
            <div className="grid grid-cols-2 gap-3"><Button variant="outlined" onClick={() => setStep(1)}>{text.back}</Button><Button variant="filled" onClick={reviewNames} disabled={names.length !== quantity || names.some(name => !normalizeCustomerName(name))}>{text.continue}</Button></div>
          </>}
          {step === 3 && <>
            <dl className="grid gap-4 rounded-lg border border-outline-variant p-4 sm:grid-cols-2 sm:p-5"><div><dt className="text-label text-on-surface-variant">{text.quantity}</dt><dd className="font-bold">{quantity}</dd></div><div><dt className="text-label text-on-surface-variant">{text.total}</dt><dd className="font-bold">{formatIdr(total, language)}</dd></div><div><dt className="text-label text-on-surface-variant">{text.session}</dt><dd>{session.className} · {session.levelName}</dd></div><div><dt className="text-label text-on-surface-variant">{text.date}</dt><dd>{date} · {formatClubTime(session.startsAt)}</dd></div></dl>
            <ol className="grid gap-2 sm:grid-cols-2">{names.map((name, index) => <li key={index} className="rounded-md bg-surface-container-low px-4 py-3">{index + 1}. {name}</li>)}</ol>
            {errorMessage && <StatusPanel tone="error" title={errorMessage} />}
            <div className="grid grid-cols-2 gap-3"><Button variant="outlined" disabled={pending} onClick={() => setStep(2)}>{text.back}</Button><Button variant="filled" disabled={pending || !options?.canReserve || !options} pendingLabel={pending ? text.working : undefined} onClick={() => void confirm()}>{text.confirm}</Button></div>
          </>}
        </>}
    </m.section>
  </main>
}
