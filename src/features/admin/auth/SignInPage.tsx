import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LanguageMenu } from '@/components/ui/language-switch'
import { PasswordField } from '@/components/ui/password-field'
import { TextField } from '@/components/ui/text-field'
import { StatusPanel } from '@/components/ui/status-panel'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { useI18n } from '@/i18n/use-i18n'
import { authMessages } from './auth.messages'
import { useAdminAuth } from './use-admin-auth'
import type { ApiErrorCode } from '@shared/api/errors'
import { safeAdminReturnPath } from './return-path'

export function SignInPage({ expired = false }: { expired?: boolean }) {
  const { state, signIn } = useAdminAuth()
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const routeState = location.state as { from?: unknown; restricted?: boolean } | null
  const destination = expired ? location.pathname + location.search : safeAdminReturnPath(routeState?.from)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [missing, setMissing] = useState({ email: false, password: false })
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<{ code?: ApiErrorCode; retryUntil?: number } | null>(null)
  const [now, setNow] = useState(Date.now)
  const sending = useRef(false)
  const mounted = useRef(true)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => {
    if (!failure?.retryUntil) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [failure?.retryUntil])
  const remaining = Math.max(0, (failure?.retryUntil ?? 0) - now)

  if (!expired && state.status === 'signedIn') return <Navigate to={destination} replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending.current || remaining > 0) return
    const invalid = { email: !email.trim(), password: !password }
    setMissing(invalid)
    if (invalid.email || invalid.password) {
      form.current?.querySelector<HTMLInputElement>(invalid.email ? '[name=email]' : '[name=password]')?.focus()
      return
    }
    sending.current = true
    setPending(true)
    setFailure(null)
    try {
      const result = await signIn(email.trim(), password)
      if (!mounted.current) return
      setPassword('')
      if (result.kind === 'ok') navigate(destination, { replace: true })
      else if (result.kind === 'http') {
        const retryUntil = result.retryAfterSeconds ? Date.now() + result.retryAfterSeconds * 1000 : undefined
        setNow(Date.now())
        setFailure({ code: result.code, retryUntil })
      } else if (result.kind !== 'aborted') setFailure({})
    } finally {
      sending.current = false
      if (mounted.current) setPending(false)
    }
  }

  return (
    <div className="min-h-dvh bg-surface pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="bg-signboard pt-[env(safe-area-inset-top)] text-on-signboard [&_:focus-visible]:outline-white">
        <div className="page-gutter mx-auto flex min-h-16 max-w-[50rem] items-center justify-between gap-3">
          <p className="font-display text-headline font-bold uppercase">LAFU</p><LanguageMenu />
        </div>
      </header>
      <main className="page-gutter mx-auto flex w-full max-w-lg flex-col gap-6 py-8">
        <h1 className="text-headline font-bold text-on-surface">{t(authMessages.heading)}</h1>
        {(expired || routeState?.restricted) && <StatusPanel tone="info" title={t(expired ? apiErrorMessages.UNAUTHENTICATED : authMessages.restricted)} />}
        <form ref={form} onSubmit={submit} noValidate className="flex min-w-0 flex-col gap-6" aria-busy={pending}>
          <TextField name="email" label={t(authMessages.email)} hint={t(authMessages.emailHint)} type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false}
            value={email} onChange={event => { setEmail(event.target.value); setMissing(value => ({ ...value, email: false })) }} error={missing.email ? t(authMessages.requiredEmail) : undefined} required />
          <PasswordField name="password" label={t(authMessages.password)} autoComplete="current-password" value={password}
            onChange={event => { setPassword(event.target.value); setMissing(value => ({ ...value, password: false })) }} error={missing.password ? t(authMessages.requiredPassword) : undefined}
            showLabel={t(authMessages.showPassword)} hideLabel={t(authMessages.hidePassword)} required />
          {failure && <StatusPanel tone="error" title={failure.retryUntil && remaining === 0 ? t(authMessages.throttleReady) : failure.code ? t(apiErrorMessages[failure.code] ?? apiErrorMessages.INTERNAL, { minutes: Math.max(1, Math.ceil(remaining / 60_000)) }) : t(authMessages.network)} />}
          <Button type="submit" variant="filled" disabled={pending || remaining > 0} pendingLabel={pending ? t(authMessages.pending) : undefined}>{t(authMessages.submit)}</Button>
        </form>
        <Button asChild variant="text"><Link to="/" aria-label={t(authMessages.backLabel)}><ArrowLeft aria-hidden="true" className="size-5" />{t(authMessages.back)}</Link></Button>
      </main>
    </div>
  )
}
