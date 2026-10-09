import { CourtBand } from '@/features/public/layout/CourtBand'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Lightbulb, Smartphone, UserRound } from 'lucide-react'
import { Navigate, useSearchParams } from 'react-router-dom'
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

export function Component() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const returnPath = safeCustomerReturnPath(params.get('returnTo'))
  const returnDate = new URL(returnPath, window.location.origin).searchParams.get('date')
  const schedulePath = returnDate ? `/?date=${encodeURIComponent(returnDate)}` : '/'
  const access = useCustomerAccess()
  const { state, pending } = access
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [invalid, setInvalid] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now)
  const heading = useRef<HTMLHeadingElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const reduceMotion = useReducedMotion()

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
  const codeExpired = state.stage === 'code' && Date.parse(state.challenge.expiresAt) <= serverNow
  const title = state.stage === 'code' ? messages.codeHeading
    : state.stage === 'name' ? messages.nameHeading
    : state.stage === 'complete' ? messages.account : messages.heading
  const errorText = access.failure === 'network' ? t(messages.network)
    : access.failure ? t(apiErrorMessages[access.failure.code], { seconds: retrySeconds }) : null

  if (state.stage === 'complete' && params.has('returnTo')) return <Navigate to={returnPath} replace />

  function showInvalid(field: string) {
    setInvalid(field)
    form.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus()
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
  const signingIn = state.stage === 'phone' || state.stage === 'code' || state.stage === 'name'
  const pendingLabel = state.stage === 'phone' ? messages.requesting : state.stage === 'code' ? messages.verifying : messages.completing
  const submitLabel = state.stage === 'phone' ? messages.request : state.stage === 'code' ? messages.verify : messages.complete

  // Signed in and opened from the Akun tab: the account summary under the court band.
  if (state.stage === 'complete') {
    return <>
      <CourtBand title={t(title)} headingRef={heading} />
      <section className="page-gutter mx-auto flex w-full max-w-lg min-w-0 flex-col gap-5 py-6">
        <StatusPanel tone="success" title={t(messages.signedIn)} />
        <dl className="flex min-w-0 flex-col rounded-sm bg-surface-container-lowest px-4 break-words">
          <div className="flex justify-between gap-4 border-b border-outline-variant py-3"><dt className="text-label text-on-surface-variant">{t(messages.name)}</dt><dd className="text-right font-semibold">{state.session.customer.displayName}</dd></div>
          <div className="flex justify-between gap-4 py-3"><dt className="text-label text-on-surface-variant">{t(messages.phone)}</dt><dd className="text-right tabular-nums">{state.session.customer.phone}</dd></div>
        </dl>
        {errorText && <StatusPanel tone="error" title={errorText} />}
        <Button variant="outlined" disabled={pending || retrySeconds > 0} pendingLabel={pending ? t(messages.signingOut) : undefined}
          onClick={() => { setPhone(''); setCode(''); setName(''); void access.signOut() }}>{t(messages.signOut)}</Button>
        <p className="text-label text-on-surface-variant">{t(messages.recovery)}</p>
      </section>
    </>
  }

  return <div className="flex min-h-dvh flex-col">
    <AuthHero backTo={schedulePath} backLabel={t(messages.backLabel)} compact={state.stage !== 'phone' && state.stage !== 'loading'} />
    <m.section key={state.stage} initial={{ opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : state.stage === 'phone' ? -12 : 12 }}
      animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }}
      className="page-gutter mx-auto flex w-full max-w-lg min-w-0 flex-1 flex-col gap-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 ref={heading} tabIndex={-1} className="text-headline font-bold text-on-surface focus:outline-none">{t(title)}</h1>
        {state.stage === 'phone' && <p className="text-on-surface-variant">{t(messages.introduction)}</p>}
        {state.stage === 'code' && <p className="text-on-surface-variant">{t(messages.codeHint, { phone: state.challenge.maskedPhone })}</p>}
        {state.stage === 'name' && <p className="text-on-surface-variant">{t(messages.nameHint)}</p>}
      </div>

      {state.stage === 'loading' ? <p role="status" className="text-center">{t(messages.loading)}</p>
        : state.stage === 'loadError' ? <StatusPanel tone="error" title={errorText || t(messages.loadError)} action={{ label: t(messages.retry), onAction: access.reload }} />
        : signingIn && <>
          {state.stage === 'phone' && bookingSessionId && <BookingContext sessionId={bookingSessionId} />}
          {state.stage === 'code' && import.meta.env.DEV && state.challenge.development === true && state.challenge.debugCode && <StatusPanel tone="info" title={t(messages.testHeading)}>
            <p className="text-label">{t(messages.testNotice)}</p>
            <p className="select-all text-headline font-bold tracking-[0.2em]" data-development-code>{state.challenge.debugCode}</p>
          </StatusPanel>}
          <form ref={form} onSubmit={submit} noValidate aria-busy={pending} className="flex min-w-0 flex-col gap-5">
            {state.stage === 'phone' && <TextField name="phone" label={t(messages.phone)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0812 3456 7890"
              leading={<Smartphone className="size-5" />}
              value={phone} onChange={event => { setPhone(event.target.value); setInvalid(null) }} error={invalid === 'phone' ? t(messages.phoneError) : undefined} maxLength={50} required />}
            {state.stage === 'code' && <CodeBoxes name="code" label={t(messages.code)} value={code}
              onValueChange={value => { setCode(value); setInvalid(null) }} error={invalid === 'code' ? t(messages.codeError) : undefined} required />}
            {state.stage === 'name' && <TextField name="name" label={t(messages.name)} autoComplete="name" value={name} leading={<UserRound className="size-5" />}
              onChange={event => { setName(event.target.value); setInvalid(null) }} error={invalid === 'name' ? t(messages.nameError) : undefined} maxLength={120} required />}
            {state.stage === 'code' && <div className="flex flex-wrap items-center justify-between gap-2">
              <Button type="button" variant="text" className="-ml-3" onClick={editPhone} disabled={pending}>{t(messages.editPhone)}</Button>
              <Button type="button" variant="text" className="-mr-3" disabled={pending || resendSeconds > 0} onClick={() => { setCode(''); void access.resendCode() }}>
                {resendSeconds > 0 ? t(messages.resendWait, { seconds: resendSeconds }) : t(messages.resend)}
              </Button>
            </div>}
            {errorText && <StatusPanel tone="error" title={errorText} />}
            {codeExpired && <StatusPanel tone="info" title={t(apiErrorMessages.OTP_EXPIRED)} />}
            <Button type="submit" variant="filled" className="min-h-14 w-full" disabled={pending || retrySeconds > 0 || codeExpired}
              pendingLabel={pending ? t(pendingLabel) : undefined}>{t(submitLabel)}</Button>
            {state.stage === 'name' && <Button type="button" variant="text" onClick={editPhone} disabled={pending}>{t(messages.restart)}</Button>}
          </form>
          <div className="mt-auto flex flex-col gap-3 pt-2">
            {state.stage === 'code' && <RandomTip />}
            {state.stage === 'phone' && <p className="text-center text-label text-on-surface-variant">{bookingSessionId ? t(messages.noHold) : t(messages.recovery)}</p>}
          </div>
        </>}
    </m.section>
  </div>
}

// The session the visitor was about to book, so signing in never feels like a detour.
function BookingContext({ sessionId }: { sessionId: string }) {
  const { language, t } = useI18n()
  const [session, setSession] = useState<PublicSessionSummary | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void getJson<PublicSessionSummary>(`/api/public/sessions/${encodeURIComponent(sessionId)}`, { signal: controller.signal })
      .then(result => { if (result.kind === 'ok') setSession(result.data) })
    return () => controller.abort()
  }, [sessionId])
  if (!session) return null
  return (
    <div className="flex items-center gap-3 rounded-sm bg-surface-container-lowest p-2.5 pr-4">
      <span aria-hidden="true" className="flex w-11 shrink-0 flex-col items-center rounded-xs bg-band-tile py-1 leading-tight text-on-signboard">
        <span className="text-label">{formatClubWeekdayShort(session.date, language)}</span>
        <span className="text-title font-bold tabular-nums">{clubDayOfMonth(session.date)}</span>
      </span>
      <p className="flex min-w-0 flex-col leading-snug">
        <span className="text-label text-on-surface-variant">{t(messages.bookingFor)}</span>
        <span className="truncate font-semibold">{session.className}, {session.startTime}</span>
        <span className="sr-only">{formatClubDateMedium(session.date, language)}</span>
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
