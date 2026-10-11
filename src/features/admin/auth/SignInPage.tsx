import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ChevronLeft, LockKeyhole, Mail } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CourtLines } from '@/components/brand/court-lines'
import { Wordmark } from '@/components/brand/ball-mark'
import { Button } from '@/components/ui/button'
import { LanguageMenu } from '@/components/ui/language-switch'
import { PasswordField } from '@/components/ui/password-field'
import { TextField } from '@/components/ui/text-field'
import { StatusPanel } from '@/components/ui/status-panel'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { useI18n } from '@/i18n/use-i18n'
import { clubContent } from '@/features/public/club/club-content'
import { adminNavLeading, adminNavTrailing } from '../shell/admin-nav'
import { shellMessages } from '../shell/shell.messages'
import { authMessages } from './auth.messages'
import { useAdminAuth } from './use-admin-auth'
import type { ApiErrorCode } from '@shared/api/errors'
import { safeAdminReturnPath } from './return-path'

// What each admin destination is for, shown beside the form on wide screens so a new admin knows what is inside.
const areaHints = {
  '/admin/sessions': authMessages.areaSessions,
  '/admin/bookings': authMessages.areaBookings,
  '/admin/classes': authMessages.areaClasses,
  '/admin/coaches': authMessages.areaManage,
} as const

function formatWait(milliseconds: number) {
  const seconds = Math.ceil(milliseconds / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

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
  const locked = remaining > 0

  if (!expired && state.status === 'signedIn') return <Navigate to={destination} replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending.current || locked) return
    // Development builds: both fields empty signs in through the development shortcut instead of failing validation.
    const shortcut = import.meta.env.DEV && !email.trim() && !password
    const invalid = { email: !shortcut && !email.trim(), password: !shortcut && !password }
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

  const notice = expired ? apiErrorMessages.UNAUTHENTICATED : routeState?.restricted ? authMessages.restricted : null
  const failureText = !failure ? null
    : failure.retryUntil && !locked ? t(authMessages.throttleReady)
    : failure.code ? t(apiErrorMessages[failure.code] ?? apiErrorMessages.INTERNAL, { minutes: Math.max(1, Math.ceil(remaining / 60_000)) })
    : t(authMessages.network)
  const failureTone = failure?.retryUntil ? (locked ? 'warning' : 'info') : 'error'

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface lg:flex-row">
      {/* Ink panel: the admin side of the club. A header band on phones, the left column on wide screens. */}
      <header className="relative isolate shrink-0 overflow-hidden rounded-b-lg bg-ink pt-[env(safe-area-inset-top)] text-on-ink [&_:focus-visible]:outline-accent lg:flex lg:w-[42%] lg:max-w-[40rem] lg:flex-col lg:rounded-none">
        <CourtLines className="pointer-events-none absolute -bottom-24 -right-16 -z-10 h-72 text-on-ink/10 lg:-bottom-28 lg:-right-10 lg:h-[22rem]" />
        <div className="page-gutter mx-auto flex w-full max-w-lg flex-col gap-10 pb-7 lg:max-w-none lg:flex-1 lg:gap-14 lg:px-12 lg:py-12">
          <div className="flex min-h-16 items-center justify-between gap-2 lg:flex-row-reverse">
            <Link to="/schedule" aria-label={t(authMessages.backLabel)}
              className="state-layer pressable flex min-h-12 items-center gap-1.5 rounded-full bg-ink-raised xl:pl-3 xl:pr-5">
              <span className="flex size-12 items-center justify-center xl:size-auto"><ChevronLeft aria-hidden="true" className="size-6" /></span>
              <span className="hidden font-semibold xl:inline">{t(authMessages.backLabel)}</span>
            </Link>
            <p className="flex items-center gap-2" aria-label={`${clubContent.name} ${t(shellMessages.admin)}`}>
              <Wordmark name={clubContent.shortName} />
              <span aria-hidden="true" className="rounded-full bg-ink-raised px-2.5 py-0.5 text-label font-semibold max-[359px]:hidden">{t(shellMessages.admin)}</span>
            </p>
            <LanguageMenu className="border border-on-ink/25 text-on-ink lg:hidden" />
          </div>

          <div className="flex flex-col gap-1.5 lg:hidden">
            <h1 className="text-display font-bold leading-tight">{t(authMessages.heading)}</h1>
            <p className="text-on-ink-variant">{t(authMessages.intro)}</p>
          </div>

          <div className="hidden max-w-[32rem] flex-col gap-3 lg:flex">
            <p className="text-display font-bold leading-tight">{t(authMessages.desk, { club: clubContent.name })}</p>
            <p className="text-title text-on-ink-variant">{t(authMessages.deskIntro)}</p>
          </div>
          <ul className="hidden max-w-[32rem] flex-col lg:flex">
            {[...adminNavLeading, ...adminNavTrailing].map(({ to, label, Icon }) => (
              <li key={to} className="flex items-center gap-4 border-t border-ink-raised py-3">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-md bg-ink-raised"><Icon className="size-5" /></span>
                <span className="flex min-w-0 flex-col leading-snug">
                  <span className="font-bold">{t(label)}</span>
                  <span className="text-label text-on-ink-variant">{t(areaHints[to as keyof typeof areaHints])}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <main className="page-gutter mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 lg:max-w-none lg:px-12 lg:py-12">
        <div className="hidden justify-end lg:flex"><LanguageMenu className="border border-outline-variant text-on-surface" /></div>
        <div className="flex flex-1 flex-col lg:items-center lg:justify-center">
          <div className="flex w-full flex-1 flex-col gap-6 lg:max-w-[29rem] lg:flex-none lg:rounded-lg lg:bg-surface-container-lowest lg:p-10">
            <div className="hidden flex-col gap-1.5 lg:flex">
              <h1 className="text-display font-bold leading-tight">{t(authMessages.heading)}</h1>
              <p className="text-on-surface-variant">{t(authMessages.intro)}</p>
            </div>
            {notice && <StatusPanel tone="info" title={t(notice)} />}
            {import.meta.env.DEV && <p className="rounded-sm bg-warning-container px-4 py-3 text-label font-semibold text-warning">{t(authMessages.devShortcut)}</p>}
            <form ref={form} onSubmit={submit} noValidate className="flex min-w-0 flex-col gap-5" aria-busy={pending}>
              <TextField name="email" label={t(authMessages.email)} hint={t(authMessages.emailHint)} type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false}
                placeholder="nama@email.com" leading={<Mail className="size-5" />}
                value={email} onChange={event => { setEmail(event.target.value); setMissing(value => ({ ...value, email: false })) }} error={missing.email ? t(authMessages.requiredEmail) : undefined} required />
              <PasswordField name="password" label={t(authMessages.password)} autoComplete="current-password" value={password} leading={<LockKeyhole className="size-5" />}
                onChange={event => { setPassword(event.target.value); setMissing(value => ({ ...value, password: false })) }} error={missing.password ? t(authMessages.requiredPassword) : undefined}
                showLabel={t(authMessages.showPassword)} hideLabel={t(authMessages.hidePassword)} required />
              {failureText && <StatusPanel tone={failureTone} title={failureText}>
                {locked && <p className="text-headline font-bold tabular-nums" aria-hidden="true">{formatWait(remaining)}</p>}
              </StatusPanel>}
              <Button type="submit" variant="filled" className="min-h-14 w-full tabular-nums" disabled={pending || locked} pendingLabel={pending ? t(authMessages.pending) : undefined}>
                {locked ? t(authMessages.wait, { time: formatWait(remaining) }) : t(authMessages.submit)}
              </Button>
            </form>
            <p className="mt-auto text-center text-label text-on-surface-variant lg:mt-0 lg:border-t lg:border-outline-variant lg:pt-4 lg:text-left">{t(authMessages.forgot)}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
