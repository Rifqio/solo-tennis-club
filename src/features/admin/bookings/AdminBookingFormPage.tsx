import { useEffect, useRef, useState } from 'react'
import { Clock, Phone, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { m, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { StepperField } from '@/components/ui/stepper-field'
import { TextField } from '@/components/ui/text-field'
import { apiErrorMessages, fieldErrorMessage } from '@/i18n/api-error-messages'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { setNavMotion } from '@/lib/nav-motion'
import type { AdminBookingOptionsResponse, AdminCreateBookingRequest } from '@shared/api/admin-bookings'
import type { AdmittedBookingResponse } from '@shared/api/booking-admission'
import type { FieldErrorCode } from '@shared/api/errors'
import { normalizeCustomerName, normalizeCustomerPhone } from '@shared/customer-rules'
import { useAdminAuth } from '../auth/use-admin-auth'
import { useAdminResource } from '../forms/use-admin-resource'
import { useUnsavedChangesGuard } from '../forms/use-unsaved-changes-guard'
import { AdminBand } from '../shell/AdminBand'
import { adminBookingFormMessages as messages } from './bookings.messages'
import { stepEnter, useStepDirection } from '@/lib/step-motion'

type Step = 1 | 2 | 3
type Errors = Partial<Record<'bookerName' | 'bookerPhone' | 'participantNames', FieldErrorCode>>

export type CreatedBookingState = { created: { deadline: string; replayed: boolean } }

export function Component() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const options = useAdminResource<AdminBookingOptionsResponse>(`/api/admin/booking-options/${encodeURIComponent(id)}`)
  const back = { to: `/admin/sessions/${encodeURIComponent(id)}/roster`, label: t(messages.back) }

  if (!options.data) {
    const response = options.response
    return <>
      <AdminBand title={t(messages.title)} back={back} />
      <div className="page-gutter mx-auto w-full max-w-[50rem] py-4">
        {!response ? <p role="status" className="appear-late">{t(messages.loading)}</p>
          : response.kind === 'http' && response.status === 404 ? <StatusPanel tone="info" title={t(messages.missing)} />
          : <StatusPanel tone="error" title={t(messages.loadError)} action={{ label: t(commonMessages.retry), onAction: options.retry }} />}
      </div>
    </>
  }
  return <BookingForm key={id} initial={options.data} back={back} />
}

function unavailableReason(options: AdminBookingOptionsResponse) {
  if (options.session.cancelled) return messages.cancelled
  if (Date.parse(options.serverNow) >= Date.parse(options.bookingClosesAt)) return messages.closed
  if (options.remainingPlaces < 1) return messages.full
  return null
}

function BookingForm({ initial, back }: { initial: AdminBookingOptionsResponse; back: { to: string; label: string } }) {
  const { t, language } = useI18n()
  const { get, send } = useAdminAuth()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [options, setOptions] = useState(initial)
  const [step, setStep] = useState<Step>(1)
  const direction = useStepDirection(step)
  const [bookerName, setBookerName] = useState('')
  const [bookerPhone, setBookerPhone] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [names, setNames] = useState<string[]>([''])
  const [errors, setErrors] = useState<Errors>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  // One request ID per distinct payload: a retry after a lost response reuses it so the server replays instead of
  // booking twice, and any edit gets a fresh one.
  const request = useRef<{ key: string; id: string } | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const { session } = options
  const count = /^\d+$/.test(quantity) ? Number(quantity) : 0
  const dirty = Boolean(bookerName.trim() || bookerPhone.trim() || count > 1 || names.some(name => name.trim()))
  const guard = useUnsavedChangesGuard(dirty, undefined, pending)
  const unavailable = unavailableReason(options)

  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [step])

  const label = (field: keyof Errors) => t(field === 'bookerName' ? messages.bookerName : field === 'bookerPhone' ? messages.bookerPhone : messages.playerName)
  const errorFor = (field: keyof Errors) => errors[field] ? t(fieldErrorMessage(field, errors[field]!), { field: label(field) }) : undefined

  function validateContact() {
    const next: Errors = {}
    if (!bookerName.trim()) next.bookerName = 'REQUIRED'
    else if (!normalizeCustomerName(bookerName)) next.bookerName = 'INVALID_FORMAT'
    if (!bookerPhone.trim()) next.bookerPhone = 'REQUIRED'
    else if (!normalizeCustomerPhone(bookerPhone)) next.bookerPhone = 'INVALID_FORMAT'
    setErrors(next)
    if (next.bookerName || next.bookerPhone) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid=true]')?.focus())
      return false
    }
    return true
  }

  // Player 1 is the booker unless typed otherwise; the rest start as "Rina 2", "Rina 3", as in the app.
  function defaultName(index: number) {
    const booker = normalizeCustomerName(bookerName) ?? ''
    return index === 0 ? booker : `${booker} ${index + 1}`
  }

  function goToPlayers() {
    if (!validateContact()) return
    setNames(current => Array.from({ length: Math.max(1, count) }, (_, index) => current[index]?.trim() ? current[index]! : defaultName(index)))
    setStep(2)
  }

  function changeQuantity(value: string) {
    setQuantity(value)
    if (!/^\d+$/.test(value)) return
    const next = Math.min(Number(value), 500)
    setNames(current => Array.from({ length: next }, (_, index) => current[index] ?? defaultName(index)))
  }

  function goToReview() {
    const valid = count >= 1 && count <= options.remainingPlaces && names.length === count && names.every(name => normalizeCustomerName(name))
    setErrors(valid ? {} : { participantNames: names.some(name => !name.trim()) ? 'REQUIRED' : 'INVALID_FORMAT' })
    if (!valid) return
    setNames(current => current.map(name => normalizeCustomerName(name)!))
    setStep(3)
  }

  function payload(): AdminCreateBookingRequest {
    const body = { sessionId: session.id, quantity: count, participantNames: names, expectedSessionVersion: options.sessionVersion, bookerName, bookerPhone }
    const key = JSON.stringify(body)
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() }
    return { ...body, createRequestId: request.current.id }
  }

  async function refreshOptions() {
    const latest = await get<AdminBookingOptionsResponse>(`/api/admin/booking-options/${encodeURIComponent(session.id)}`)
    if (latest.kind === 'ok') setOptions(latest.data)
    return latest.kind === 'ok' ? latest.data : null
  }

  async function save() {
    if (pending) return
    setPending(true); setFailure(null)
    try {
      const result = await send<AdmittedBookingResponse>('POST', '/api/admin/bookings', payload())
      if (result.kind === 'ok') {
        guard.allowNavigation()
        const state: CreatedBookingState = { created: { deadline: result.data.booking.originalDeadline, replayed: result.data.replayed } }
        setNavMotion('push')
        navigate(`/admin/bookings/${result.data.booking.id}`, { replace: true, state, viewTransition: true })
        return
      }
      if (result.kind === 'network') { setFailure(t(messages.unsure)); return }
      if (result.kind !== 'http') return
      if (result.code === 'VALIDATION_FAILED' && result.fields) {
        setErrors(result.fields as Errors)
        setStep(result.fields.bookerName || result.fields.bookerPhone ? 1 : 2)
        return
      }
      if (result.code === 'CAPACITY_UNAVAILABLE') {
        const latest = await refreshOptions()
        setFailure(latest ? t(messages.refreshed, { count: latest.remainingPlaces }) : t(apiErrorMessages.CAPACITY_UNAVAILABLE))
        setStep(2)
        return
      }
      if (result.code === 'SESSION_CHANGED') {
        await refreshOptions()
        setFailure(t(messages.changed))
        return
      }
      if (result.code === 'BOOKING_CLOSED') await refreshOptions()
      setFailure(t(apiErrorMessages[result.code]))
    } finally { setPending(false) }
  }

  const stepMotion = stepEnter(direction, reduceMotion)
  const when = `${formatClubDateShort(session.date, language)}, ${session.startTime}-${session.endTime} WIB`
  const total = formatIdr(options.unitPriceIdr * Math.max(count, 0), language)
  const row = 'flex justify-between gap-4 py-3'

  return <>
    <AdminBand title={t(messages.title)} back={back} subtitle={`${session.className} · ${when}`}>
      <div className="flex gap-1.5" aria-hidden="true">{[1, 2, 3].map(index => <span key={index} className={cn('h-1.5 flex-1 rounded-full', index <= step ? 'bg-accent' : 'bg-band-tile')} />)}</div>
    </AdminBand>
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-5 overflow-x-clip py-5" aria-busy={pending}>
      <div>
        <p className="text-label text-on-surface-variant">{t(messages.stepOf, { n: step })}</p>
        <h2 ref={heading} tabIndex={-1} className="text-title font-bold focus:outline-none">{t(messages.steps[step - 1]!)}</h2>
      </div>

      {unavailable ? <StatusPanel tone="info" title={t(unavailable)} /> : (
        <m.div key={step} {...stepMotion} className="flex min-w-0 flex-col gap-5">
          {step === 1 && <>
            <TextField name="bookerName" label={t(messages.bookerName)} hint={t(messages.bookerNameHint)} value={bookerName} maxLength={120} autoComplete="off"
              leading={<UserRound className="size-5" />} error={errorFor('bookerName')} onChange={event => setBookerName(event.target.value)} />
            <TextField name="bookerPhone" label={t(messages.bookerPhone)} hint={t(messages.bookerPhoneHint)} value={bookerPhone} maxLength={50} type="tel" inputMode="tel" autoComplete="off"
              placeholder="08xx xxxx xxxx" leading={<Phone className="size-5" />} error={errorFor('bookerPhone')} onChange={event => setBookerPhone(event.target.value)} />
          </>}

          {step === 2 && <>
            <StepperField name="quantity" label={t(messages.quantity)} value={quantity} onChange={changeQuantity} min={1} max={options.remainingPlaces}
              hint={t(messages.left, { count: options.remainingPlaces })} decreaseLabel={t(messages.fewer)} increaseLabel={t(messages.more)}
              error={count > options.remainingPlaces ? t(apiErrorMessages.CAPACITY_UNAVAILABLE) : undefined} />
            <div className="grid gap-4 sm:grid-cols-2">
              {names.map((name, index) => (
                <TextField key={index} name={`participant-${index}`} label={t(messages.player, { n: index + 1 })} value={name} maxLength={120} autoComplete="off"
                  leading={<UserRound className="size-5" />} error={errors.participantNames && !normalizeCustomerName(name) ? errorFor('participantNames') : undefined}
                  onChange={event => setNames(current => current.map((value, position) => position === index ? event.target.value : value))} />
              ))}
            </div>
          </>}

          {step === 3 && <>
            <dl className="flex flex-col divide-y divide-outline-variant rounded-sm bg-surface-container-lowest px-4">
              <div className={row}><dt className="text-label text-on-surface-variant">{t(messages.session)}</dt><dd className="text-right"><span className="block font-semibold">{session.className}</span><span className="text-label tabular-nums text-on-surface-variant">{when} · {session.venueName}</span></dd></div>
              <div className={row}><dt className="text-label text-on-surface-variant">{t(messages.contact)}</dt><dd className="min-w-0 text-right"><span className="block break-words font-semibold">{normalizeCustomerName(bookerName)}</span><span className="text-label tabular-nums text-on-surface-variant">{normalizeCustomerPhone(bookerPhone)}</span></dd></div>
              <div className={row}><dt className="text-label text-on-surface-variant">{t(messages.players, { count })}</dt><dd className="min-w-0 text-right"><ol>{names.map((name, index) => <li key={index} className="break-words">{name}</li>)}</ol></dd></div>
              <div className={row}><dt className="text-label text-on-surface-variant">{t(messages.total)}</dt><dd className="text-right font-bold tabular-nums">{total}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button variant="text" disabled={pending} onClick={() => setStep(1)}>{t(messages.editContact)}</Button>
              <Button variant="text" disabled={pending} onClick={() => setStep(2)}>{t(messages.editPlayers)}</Button>
            </div>
            <section aria-label={t(messages.holdTitle)} className="flex gap-3 rounded-sm bg-primary-container p-3.5 text-on-primary-container">
              <Clock aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
              <p className="text-label"><span className="block text-body font-semibold text-primary">{t(messages.holdTitle)}</span>{t(messages.holdBody)}</p>
            </section>
            <p className="text-label text-on-surface-variant">{t(messages.unlinked)}</p>
          </>}
        </m.div>
      )}
      {failure && <StatusPanel tone="error" title={failure} />}
    </div>
    {!unavailable && (
      <div className="sticky bottom-0 z-10 border-t border-outline-variant bg-surface-container-lowest pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="page-gutter mx-auto grid max-w-[50rem] grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-2">
          {step > 1 && <Button className="min-w-0 px-3" variant="text" disabled={pending} onClick={() => setStep((step - 1) as Step)}>{t(messages.previous)}</Button>}
          {step === 1 && <Button className="col-start-2 min-w-0 px-3" variant="filled" onClick={goToPlayers}>{t(messages.next)}</Button>}
          {step === 2 && <Button className="min-w-0 px-3" variant="filled" onClick={goToReview}>{t(messages.next)}</Button>}
          {step === 3 && <Button className="min-w-0 px-3" variant="filled" disabled={pending} pendingLabel={pending ? t(messages.saving) : undefined} onClick={() => void save()}>{t(messages.save)}</Button>}
        </div>
      </div>
    )}
    {guard.dialog}
  </>
}
