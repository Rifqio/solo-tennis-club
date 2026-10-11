import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ChevronLeft, Lightbulb, Smartphone, UserRound } from 'lucide-react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { m, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { CodeBoxes } from '@/components/ui/code-boxes'
import { TextField } from '@/components/ui/text-field'
import { StatusPanel } from '@/components/ui/status-panel'
import { useI18n } from '@/i18n/use-i18n'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { clubDayOfMonth, formatClubDateMedium, formatClubWeekdayShort } from '@/i18n/format'
import { getJson } from '@/lib/api'
import type { PublicSessionSummary } from '@shared/api/public'
import { normalizeCustomerName, normalizeCustomerPhone } from '@shared/customer-rules'
import { customerAuthMessages as messages } from './customer-auth.messages'
import { useCustomerAccess } from './use-customer-access'
import { safeCustomerReturnPath } from './customer-return-path'
import { AuthHero } from './AuthHero'
import { stepEnter, useStepDirection } from '@/lib/step-motion'
import { ConnectionBanner } from '@/components/ui/connection-banner'
import { revealInvalid } from '@/lib/reveal-invalid'
import { useToast } from '@/components/ui/use-toast'
import { Wordmark } from '@/components/brand/ball-mark'
import { LanguageMenu } from '@/components/ui/language-switch'
import { clubContent } from '@/features/public/club/club-content'
import { contentSpring } from '@/lib/motion'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'

// Generic licensed photography (public/photos/sessions/session-13.webp.json): a court from above, in Court Blue.
const DESK_PHOTO = '/photos/sessions/session-13.webp'

const stagePosition: Record<string, number | null> = { loading: null, loadError: null, phone: 1, code: 2, name: 3, complete: 4 }

export function Component() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const returnPath = safeCustomerReturnPath(params.get('returnTo'))
  const returnDate = new URL(returnPath, window.location.origin).searchParams.get('date')
  const schedulePath = returnDate ? `/schedule?date=${encodeURIComponent(returnDate)}` : '/schedule'
  const access = useCustomerAccess()
  const { state, pending } = access
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [invalid, setInvalid] = useState<string | null>(null)
  const [codeEdited, setCodeEdited] = useState(false)
  const [now, setNow] = useState(Date.now)
  const heading = useRef<HTMLHeadingElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const toast = useToast()
  const reduceMotion = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  // Phone, code, then name: the form slides the way the visitor is going; the first form after loading just appears.
  const direction = useStepDirection(stagePosition[state.stage])

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [state.stage])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const retrySeconds = Math.max(0, Math.ceil((access.retryAt - now) / 1000))
  const serverNow = state.stage === 'code' ? now + Date.parse(state.challenge.serverNow) - state.receivedAt : now
  const resendAt = state.stage === 'code' ? Date.parse(state.challenge.resendAt) : 0
  const resendSeconds = Math.max(retrySeconds, Math.max(0, Math.ceil((resendAt - serverNow) / 1000)))
  const codeExpired = state.stage === 'code' && (Date.parse(state.challenge.expiresAt) <= serverNow
    || (access.failure !== 'network' && access.failure?.code === 'OTP_EXPIRED'))
  const title = state.stage === 'code' ? messages.codeHeading
    : state.stage === 'name' ? messages.nameHeading
    : state.stage === 'complete' ? messages.account : messages.heading
  // A wrong code is shown on the boxes themselves (red, a shake, one line under them), not as a panel.
  const codeRejected = state.stage === 'code' && access.failure !== 'network' && access.failure?.code === 'OTP_INVALID'
  const wrongCode = codeRejected && !codeEdited
  const errorText = access.failure === 'network' ? t(messages.network)
    : access.failure && !codeRejected && !(codeExpired && access.failure.code === 'OTP_EXPIRED') ? t(apiErrorMessages[access.failure.code], { seconds: retrySeconds }) : null
  // A lock is a wait, not a failure (G1 warning).
  const errorTone = access.failure !== 'network' && access.failure?.code === 'OTP_THROTTLED' ? 'warning' as const : 'error' as const
  // A sign-in lock counts down on the button that waits, nowhere else.
  const waitLabel = retrySeconds >= 3600 ? t(messages.waitHours, { hours: Math.ceil(retrySeconds / 3600) })
    : t(messages.waitMinutes, { time: `${Math.floor(retrySeconds / 60)}:${String(retrySeconds % 60).padStart(2, '0')}` })
  const resend = async () => { setCode(''); if (await access.resendCode()) toast({ message: t(messages.resent) }) }

  if (state.stage === 'complete' && params.has('returnTo')) return <Navigate to={returnPath} replace />

  function showInvalid(field: string) {
    setInvalid(field)
    // The code boxes shake on their own; other fields shake here, once, on submit.
    if (field === 'code') form.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus()
    else revealInvalid(form.current)
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || retrySeconds) return
    setInvalid(null)
    if (state.stage === 'phone') {
      const normalized = normalizeCustomerPhone(phone)
      if (!normalized) return showInvalid('phone')
      await access.requestCode(normalized)
    } else if (state.stage === 'code') {
      if (!/^\d{6}$/.test(code)) return showInvalid('code')
      setCodeEdited(false)
      if (await access.verifyCode(code)) setCode('')
    } else if (state.stage === 'name') {
      const normalized = normalizeCustomerName(name)
      if (!normalized) return showInvalid('name')
      if (await access.completeProfile(normalized)) setName('')
    }
  }
  function editPhone() {
    setCode('')
    setName('')
    setInvalid(null)
    access.editPhone()
  }

  const bookingSessionId = /^\/book\/([a-z0-9]{1,64})/.exec(returnPath)?.[1] ?? null
  const bookingQuantity = Number(new URL(returnPath, window.location.origin).searchParams.get('quantity')) || null
  const signingIn = state.stage === 'phone' || state.stage === 'code' || state.stage === 'name'
  const pendingLabel = state.stage === 'phone' ? messages.requesting : state.stage === 'code' ? messages.verifying : messages.completing
  const submitLabel = state.stage === 'phone' ? messages.request : state.stage === 'code' ? messages.verify : messages.complete
  // Back goes where the visitor came from: the booking they were making, otherwise the schedule.
  const back = bookingSessionId
    ? { to: returnPath, text: t(messages.backBooking), label: t(messages.backBookingLabel) }
    : { to: schedulePath, text: t(messages.back), label: t(messages.backLabel) }

  // Signed in already: the account lives on its own screen (Akun).
  if (state.stage === 'complete') return <Navigate to="/account" replace />

  const recovery = <p className="text-center text-label text-on-surface-variant">
    {t(messages.recoveryQuestion)}{' '}
    {clubContent.whatsapp
      ? <a href={`https://wa.me/${clubContent.whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">{t(messages.recoveryChat)}</a>
      : t(messages.recoveryAsk)}
  </p>

  // The step itself, the same on every screen size; only the frame around it differs.
  const step = <>
    <div className={cn('flex flex-col gap-1.5', isDesktop ? 'gap-2' : 'text-center')}>
      <h1 ref={heading} tabIndex={-1} className={cn('font-bold text-on-surface focus:outline-none', isDesktop ? 'text-display' : 'text-headline')}>{t(title)}</h1>
      {state.stage === 'phone' && <p className="text-on-surface-variant">{t(messages.introduction)}</p>}
      {state.stage === 'code' && <p className="text-on-surface-variant">{t(messages.codeHint, { phone: state.challenge.maskedPhone })}</p>}
      {state.stage === 'name' && <p className="text-on-surface-variant">{t(messages.nameHint)}</p>}
    </div>

    {state.stage === 'loading' ? <p role="status" className={isDesktop ? undefined : 'text-center'}>{t(messages.loading)}</p>
      : state.stage === 'loadError' ? <StatusPanel tone="error" title={errorText || t(messages.loadError)} action={{ label: t(messages.retry), onAction: access.reload }} />
      : signingIn && <>
        {state.stage === 'code' && import.meta.env.DEV && state.challenge.development === true && state.challenge.debugCode && <StatusPanel tone="info" title={t(messages.testHeading)}>
          <p className="text-label">{t(messages.testNotice)}</p>
          <p className="select-all text-headline font-bold tracking-[0.2em]" data-development-code>{state.challenge.debugCode}</p>
        </StatusPanel>}
        <form ref={form} onSubmit={submit} noValidate aria-busy={pending} className="flex min-w-0 flex-col gap-5">
          {state.stage === 'phone' && <TextField name="phone" label={t(messages.phone)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0812 3456 7890"
            leading={<Smartphone className="size-5" />} className={isDesktop ? 'min-h-16 text-title tabular-nums' : undefined}
            value={phone} onChange={event => { setPhone(event.target.value); setInvalid(null) }} error={invalid === 'phone' ? t(messages.phoneError) : undefined} maxLength={50} required />}
          {state.stage === 'code' && <CodeBoxes name="code" label={t(messages.code)} value={code}
            onValueChange={value => { setCode(value); setInvalid(null); setCodeEdited(true) }} error={invalid === 'code' ? t(messages.codeError) : wrongCode ? t(messages.wrongCode) : undefined} required />}
          {state.stage === 'name' && <TextField name="name" label={t(messages.name)} autoComplete="name" value={name} leading={<UserRound className="size-5" />}
            className={isDesktop ? 'min-h-16 text-title' : undefined}
            onChange={event => { setName(event.target.value); setInvalid(null) }} error={invalid === 'name' ? t(messages.nameError) : undefined} maxLength={120} required />}
          {state.stage === 'code' && <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="text" className="-ml-3" onClick={editPhone} disabled={pending}>{t(messages.editPhone)}</Button>
            <Button type="button" variant="text" className="-mr-3" disabled={pending || resendSeconds > 0} onClick={() => void resend()}>
              {resendSeconds > 0 && retrySeconds === 0 ? t(messages.resendWait, { seconds: resendSeconds }) : t(messages.resend)}
            </Button>
          </div>}
          {errorText && <StatusPanel tone={errorTone} title={errorText} />}
          {codeExpired && <StatusPanel tone="warning" title={t(apiErrorMessages.OTP_EXPIRED)}
            action={resendSeconds === 0 && !pending ? { label: t(messages.resend), onAction: () => void resend() } : undefined} />}
          <Button type="submit" variant="filled" className={cn('w-full', isDesktop ? 'min-h-15 text-title' : 'min-h-14')} disabled={pending || retrySeconds > 0 || codeExpired}
            pendingLabel={pending ? t(pendingLabel) : undefined}>{retrySeconds > 0 ? waitLabel : t(submitLabel)}</Button>
          {state.stage === 'name' && <Button type="button" variant="text" onClick={editPhone} disabled={pending}>{t(messages.restart)}</Button>}
        </form>
      </>}
  </>

  // Desktop (board D0m): the court from above on the left, the task on the right. No rail: signing in is a short
  // detour, and back returns to where it started.
  if (isDesktop) {
    return <div className="flex min-h-dvh">
      <aside className="flex min-h-dvh w-1/2 shrink-0 p-4">
        <div className="relative isolate flex flex-1 overflow-hidden rounded-lg bg-band-tile text-on-signboard [&_:focus-visible]:outline-white">
          <m.img src={DESK_PHOTO} alt="" decoding="async" fetchPriority="high"
            initial={reduceMotion ? false : { scale: 1.04 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-0 -z-10 size-full object-cover object-[46%_50%]" />
          <div aria-hidden="true" className="photo-scrim-court absolute inset-0 -z-10" />
          <Link to="/" viewTransition aria-label={clubContent.name} className="absolute left-8 top-7 flex min-h-12 items-center"><Wordmark name={clubContent.shortName} /></Link>
          <p className="absolute inset-x-8 bottom-9 max-w-[32rem] text-statement font-bold uppercase tracking-[-0.02em]">{t(messages.photoLine)}</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-[clamp(1.5rem,4vw,4rem)] py-7">
        <div className="flex items-center justify-between gap-3">
          <Link to={back.to} viewTransition data-nav="pop" aria-label={back.label}
            className="state-layer pressable -ml-2.5 flex min-h-12 items-center gap-1.5 rounded-full pl-2.5 pr-4 font-semibold">
            <ChevronLeft aria-hidden="true" className="size-5" />{back.text}
          </Link>
          <LanguageMenu className="border border-outline-variant text-on-surface" />
        </div>
        <ConnectionBanner voice="member" className="mx-auto w-full max-w-[26.25rem]" />
        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto flex w-full max-w-[26.25rem] flex-col gap-7">
            <StepBar stage={state.stage} />
            {bookingSessionId && <BookingContext sessionId={bookingSessionId} quantity={bookingQuantity} />}
            <m.section key={state.stage} {...stepEnter(direction, reduceMotion)} className="flex min-w-0 flex-col gap-6">{step}</m.section>
          </div>
        </div>
        {recovery}
      </div>
    </div>
  }

  return <div className="flex min-h-dvh flex-col">
    <AuthHero backTo={back.to} backLabel={back.label} compact={state.stage !== 'phone' && state.stage !== 'loading'} />
    <ConnectionBanner voice="member" className="page-gutter mx-auto w-full max-w-lg" />
    <m.section key={state.stage} {...stepEnter(direction, reduceMotion)}
      className="page-gutter mx-auto flex w-full max-w-lg min-w-0 flex-1 flex-col gap-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      {state.stage === 'phone' && bookingSessionId && <BookingContext sessionId={bookingSessionId} quantity={bookingQuantity} />}
      {step}
      {signingIn && <div className="mt-auto flex flex-col gap-3 pt-2">
        {state.stage === 'code' && <RandomTip />}
        {state.stage === 'phone' && recovery}
      </div>}
    </m.section>
  </div>
}

// Phone, then code; a new account adds its name once the code is confirmed. Two segments until then, since nobody
// knows yet whether the number has an account; the third grows into the bar instead of the count jumping to "of 3".
function StepBar({ stage }: { stage: string }) {
  const { t } = useI18n()
  const position = stage === 'code' ? 2 : stage === 'name' ? 3 : 1
  const total = stage === 'name' ? 3 : 2
  return (
    <div role="img" aria-label={t(messages.stepOf, { step: position, total })} className="flex gap-1.5">
      {Array.from({ length: total }, (_, index) => (
        <m.span key={index} initial={index === 2 ? { flexGrow: 0, opacity: 0 } : false} animate={{ flexGrow: 1, opacity: 1 }} transition={contentSpring}
          className="relative h-1 basis-0 overflow-hidden rounded-full bg-outline-variant">
          {index < position && <m.span initial={index === 0 ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ ...contentSpring, delay: index === 2 ? 0.25 : 0 }}
            className="absolute inset-0 origin-left rounded-full bg-primary" />}
        </m.span>
      ))}
    </div>
  )
}

// The session the visitor was about to book, so signing in never feels like a detour. It is also the one place that
// says the places are not taken yet.
function BookingContext({ sessionId, quantity }: { sessionId: string; quantity: number | null }) {
  const { language, t } = useI18n()
  const [session, setSession] = useState<PublicSessionSummary | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void getJson<PublicSessionSummary>(`/api/public/sessions/${encodeURIComponent(sessionId)}`, { signal: controller.signal })
      .then(result => { if (result.kind === 'ok') setSession(result.data) })
    return () => controller.abort()
  }, [sessionId])
  if (!session) return null
  const details = [session.startTime, quantity ? t(quantity === 1 ? messages.slotOne : messages.slots, { count: quantity }) : null, t(messages.noHold)].filter(Boolean).join(' · ')
  return (
    <div className="flex items-stretch overflow-hidden rounded-sm bg-surface-container-lowest">
      <span aria-hidden="true" className="flex w-14 shrink-0 flex-col items-center justify-center bg-band-tile py-1.5 leading-tight text-on-signboard lg:w-16">
        <span className="text-label font-semibold">{formatClubWeekdayShort(session.date, language)}</span>
        <span className="text-title font-bold tabular-nums lg:text-numeral">{clubDayOfMonth(session.date)}</span>
      </span>
      <span aria-hidden="true" className="my-2.5 border-l-2 border-dashed border-outline-variant" />
      <p className="flex min-w-0 flex-col justify-center px-4 py-2.5 leading-snug">
        <span className="sr-only">{t(messages.bookingFor)} </span>
        <span className="break-words font-bold">{session.className}</span>
        <span className="sr-only">{formatClubDateMedium(session.date, language)}, </span>
        <span className="text-label tabular-nums text-on-surface-variant">{details}</span>
      </p>
    </div>
  )
}


// One short tip per visit while the code arrives. Each describes something the app already does.
function RandomTip() {
  const { t } = useI18n()
  const [index] = useState(() => Math.floor(Math.random() * messages.tips.length))
  return (
    <p className="flex items-start gap-2.5 rounded-sm bg-surface-container px-3.5 py-3 text-label">
      <Lightbulb aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
      <span><span className="font-semibold">{t(messages.tip)}: </span>{t(messages.tips[index])}</span>
    </p>
  )
}
