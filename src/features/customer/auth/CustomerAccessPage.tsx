import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { m, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { StatusPanel } from '@/components/ui/status-panel'
import { useI18n } from '@/i18n/use-i18n'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { normalizeCustomerName, normalizeCustomerPhone } from '@shared/customer-rules'
import { customerAuthMessages as messages } from './customer-auth.messages'
import { useCustomerAccess } from './use-customer-access'
import { safeCustomerReturnPath } from './customer-return-path'

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

  return <section className="page-gutter mx-auto flex w-full max-w-lg min-w-0 flex-col gap-6 py-6 sm:py-8">
    <Button asChild variant="text" className="self-start"><Link to={schedulePath} aria-label={t(messages.backLabel)}><ArrowLeft aria-hidden="true" className="size-5" />{t(messages.back)}</Link></Button>
    <m.div key={state.stage} initial={{ opacity: reduceMotion ? 1 : 0, x: reduceMotion ? 0 : state.stage === 'phone' ? -12 : 12 }}
      animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} className="flex min-w-0 flex-col gap-6">
      <h1 ref={heading} tabIndex={-1} className="text-headline font-bold text-on-surface">{t(title)}</h1>
      {state.stage === 'loading' ? <p role="status">{t(messages.loading)}</p>
        : state.stage === 'loadError' ? <StatusPanel tone="error" title={errorText || t(messages.loadError)} action={{ label: t(messages.retry), onAction: access.reload }} />
        : state.stage === 'complete' ? <>
          <StatusPanel tone="success" title={t(messages.signedIn)} />
          <dl className="flex min-w-0 flex-col gap-4 break-words">
            <div><dt className="text-label text-on-surface-variant">{t(messages.name)}</dt><dd className="font-bold">{state.session.customer.displayName}</dd></div>
            <div><dt className="text-label text-on-surface-variant">{t(messages.phone)}</dt><dd>{state.session.customer.phone}</dd></div>
          </dl>
          {errorText && <StatusPanel tone="error" title={errorText} />}
          <Button variant="outlined" disabled={pending || retrySeconds > 0} pendingLabel={pending ? t(messages.signingOut) : undefined}
            onClick={() => { setPhone(''); setCode(''); setName(''); void access.signOut() }}>{t(messages.signOut)}</Button>
        </> : <>
          {state.stage === 'phone' && <p className="text-body text-on-surface-variant">{t(messages.introduction)}</p>}
          {state.stage === 'code' && import.meta.env.DEV && state.challenge.development === true && state.challenge.debugCode && <StatusPanel tone="info" title={t(messages.testHeading)}>
            <p className="text-label">{t(messages.testNotice)}</p>
            <p className="select-all font-display text-headline font-bold tracking-[0.2em]" data-development-code>{state.challenge.debugCode}</p>
          </StatusPanel>}
          {state.stage === 'name' && <p>{t(messages.nameHint)}</p>}
          <form ref={form} onSubmit={submit} noValidate aria-busy={pending} className="flex min-w-0 flex-col gap-6">
            {state.stage === 'phone' && <TextField name="phone" label={t(messages.phone)} hint={t(messages.phoneHint)} type="tel" inputMode="tel" autoComplete="tel"
              value={phone} onChange={event => { setPhone(event.target.value); setInvalid(null) }} error={invalid === 'phone' ? t(messages.phoneError) : undefined} maxLength={50} required />}
            {state.stage === 'code' && <TextField name="code" label={t(messages.code)} hint={t(messages.codeHint, { phone: state.challenge.maskedPhone })} inputMode="numeric" autoComplete="one-time-code"
              value={code} onChange={event => { setCode(event.target.value.replace(/\s/g, '')); setInvalid(null) }} error={invalid === 'code' ? t(messages.codeError) : undefined}
              autoCapitalize="none" spellCheck={false} maxLength={6} required />}
            {state.stage === 'name' && <TextField name="name" label={t(messages.name)} autoComplete="name" value={name}
              onChange={event => { setName(event.target.value); setInvalid(null) }} error={invalid === 'name' ? t(messages.nameError) : undefined} maxLength={120} required />}
            {errorText && <StatusPanel tone="error" title={errorText} />}
            {codeExpired && <StatusPanel tone="info" title={t(apiErrorMessages.OTP_EXPIRED)} />}
            <div className={state.stage === 'phone' ? 'flex flex-col' : 'grid grid-cols-2 gap-3'}>
              {state.stage !== 'phone' && <Button type="button" variant="outlined" onClick={editPhone} disabled={pending}>{t(state.stage === 'name' ? messages.restart : messages.editPhone)}</Button>}
              <Button type="submit" variant="filled" disabled={pending || retrySeconds > 0 || codeExpired}
                pendingLabel={pending ? t(state.stage === 'phone' ? messages.requesting : state.stage === 'code' ? messages.verifying : messages.completing) : undefined}>
                {t(state.stage === 'phone' ? messages.request : state.stage === 'code' ? messages.verify : messages.complete)}
              </Button>
            </div>
          </form>
          {state.stage === 'code' && <div className="flex flex-col gap-2">
            <Button variant="text" disabled={pending || resendSeconds > 0} onClick={() => { setCode(''); void access.resendCode() }}>{t(messages.resend)}</Button>
            {resendSeconds > 0 && <p className="text-label text-on-surface-variant">{t(messages.resendWait, { seconds: resendSeconds })}</p>}
          </div>}
          {state.stage === 'phone' && <p className="text-label text-on-surface-variant">{t(messages.recovery)}</p>}
          <p className="text-label text-on-surface-variant">{t(messages.noHold)}</p>
        </>}
    </m.div>
  </section>
}
