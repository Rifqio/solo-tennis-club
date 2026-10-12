import { BadgeCheck, ChevronRight, Info, Languages, LogOut, MessageCircle, Pencil, Smartphone, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import type { CustomerAccountResponse, CustomerPhoneChallengeResponse } from '@shared/api/customer-account'
import { Button, IconButton } from '@/components/ui/button'
import { CodeBoxes } from '@/components/ui/code-boxes'
import { Sheet } from '@/components/ui/sheet'
import { StatusPanel } from '@/components/ui/status-panel'
import { TextField } from '@/components/ui/text-field'
import { useToast } from '@/components/ui/use-toast'
import { apiErrorMessages, fieldErrorMessages } from '@/i18n/api-error-messages'
import { commonMessages } from '@/i18n/common.messages'
import type { Language, Message } from '@/i18n/types'
import { useI18n } from '@/i18n/use-i18n'
import { CustomerApiError, customerRequest } from '@/lib/customer-api'
import { selectionHaptic } from '@/lib/haptics'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { clubContent } from '@/features/public/club/club-content'
import { CourtBand } from '@/features/public/layout/CourtBand'
import { accountMessages as messages } from './account.messages'

type Loaded = { status: 'loading' } | { status: 'signedOut' } | { status: 'error' } | ({ status: 'ready' } & CustomerAccountResponse)

function useAccount() {
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    customerRequest<CustomerAccountResponse>('/api/customer/account', { signal: controller.signal })
      .then(data => setLoaded({ status: 'ready', ...data }))
      .catch(error => {
        if (controller.signal.aborted) return
        setLoaded(error instanceof CustomerApiError && error.status === 401 ? { status: 'signedOut' } : { status: 'error' })
      })
    return () => controller.abort()
  }, [attempt])
  // A write answers with the account as it now is; the CSRF token from the first read stays.
  const replace = (next: CustomerAccountResponse) => setLoaded(current => ({ status: 'ready', ...next, csrfToken: current.status === 'ready' ? current.csrfToken : next.csrfToken }))
  return { loaded, replace, retry: () => { setLoaded({ status: 'loading' }); setAttempt(value => value + 1) } }
}

// "+6281234567890" reads as "0812 3456 7890", the way members write their own number.
function displayPhone(phone: string) {
  const local = phone.startsWith('+62') ? '0' + phone.slice(3) : phone
  return local.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase()
}

// The message for a failed account request: the field's own reason when the server named one.
function failureText(error: unknown, t: (message: Message, vars?: Record<string, string | number>) => string, field: string) {
  if (!(error instanceof CustomerApiError)) return t(apiErrorMessages.INTERNAL)
  const code = error.detail.fields?.[field]
  if (code === 'SAME_PHONE' || code === 'PHONE_IN_USE') return t(fieldErrorMessages[code])
  return t(apiErrorMessages[error.detail.code] ?? apiErrorMessages.INTERNAL)
}

const REMINDER_KEY = 'stc:wa-reminder'

// Pengingat WA is a preference on this phone only for now: nothing sends reminders yet.
function useReminderPreference() {
  const [on, setOn] = useState(() => { try { return localStorage.getItem(REMINDER_KEY) !== 'off' } catch { return true } })
  const toggle = () => setOn(value => {
    try { localStorage.setItem(REMINDER_KEY, value ? 'off' : 'on') } catch { /* Private windows may refuse storage. */ }
    selectionHaptic()
    return !value
  })
  return [on, toggle] as const
}

function SettingRow({ icon, label, hint, trailing, onClick, href, to, danger }: {
  icon: ReactNode; label: string; hint?: string; trailing?: ReactNode; onClick?: () => void; href?: string; to?: string; danger?: boolean
}) {
  const body = <>
    <span aria-hidden="true" className={cn('flex size-10 shrink-0 items-center justify-center rounded-sm', danger ? 'bg-error-container text-error' : 'bg-primary-container text-primary')}>{icon}</span>
    <span className="flex min-w-0 flex-1 flex-col leading-snug">
      <span className={cn('font-semibold', danger && 'text-error')}>{label}</span>
      {hint && <span className="text-label text-on-surface-variant">{hint}</span>}
    </span>
    {trailing ?? (!danger && <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-on-surface-variant" />)}
  </>
  const rowClass = 'state-layer pressable flex min-h-16 w-full items-center gap-3 px-4 py-2.5 text-left'
  if (to) return <Link to={to} viewTransition className={rowClass}>{body}</Link>
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={rowClass}>{body}</a>
  if (onClick) return <button type="button" onClick={onClick} className={rowClass}>{body}</button>
  return <div className="flex min-h-16 items-center gap-3 px-4 py-2.5">{body}</div>
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h2 className="px-1 text-label font-semibold text-on-surface-variant">{title}</h2>
      <ul className="divide-y divide-outline-variant overflow-hidden rounded-sm bg-surface-container-lowest">{children}</ul>
    </section>
  )
}

function ReminderSwitch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onToggle}
      className="pressable flex min-h-12 shrink-0 items-center px-1">
      <span className={cn('relative flex h-8 w-13 items-center rounded-full border-2 transition-colors duration-150', on ? 'border-primary bg-primary' : 'border-outline bg-surface-container-highest')}>
        <span className={cn('absolute size-6 rounded-full transition-transform duration-150', on ? 'translate-x-5.5 bg-on-primary' : 'translate-x-0.5 bg-outline')} />
      </span>
    </button>
  )
}

function LanguageChoice() {
  const { language, setLanguage, t } = useI18n()
  const options: { value: Language; code: string; name: Message }[] = [
    { value: 'id', code: 'ID', name: commonMessages.languageIndonesian },
    { value: 'en', code: 'EN', name: commonMessages.languageEnglish },
  ]
  return (
    <div role="radiogroup" aria-label={t(messages.language)} className="flex shrink-0 gap-1 rounded-full bg-surface-container p-1">
      {options.map(option => {
        const on = option.value === language
        return (
          <button key={option.value} type="button" role="radio" aria-checked={on} aria-label={option.name[option.value]} lang={option.value}
            onClick={() => { if (!on) { setLanguage(option.value); selectionHaptic() } }}
            className={cn('pressable min-h-10 min-w-12 rounded-full px-3 text-label font-bold', on ? 'bg-primary text-on-primary' : 'text-on-surface-variant')}>
            {option.code}
          </button>
        )
      })}
    </div>
  )
}

function NameSheet({ open, onClose, account, onSaved }: {
  open: boolean; onClose: () => void; account: CustomerAccountResponse; onSaved: (next: CustomerAccountResponse) => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState(account.customer.displayName)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  async function save(event: FormEvent) {
    event.preventDefault()
    const displayName = name.trim().replace(/\s+/g, ' ')
    if (!displayName) return setError(t(messages.nameError))
    setPending(true); setError(null)
    try {
      onSaved(await customerRequest<CustomerAccountResponse>('/api/customer/account/name', { method: 'PUT', body: { displayName }, csrfToken: account.csrfToken }))
    } catch (failure) { setError(failureText(failure, t, 'displayName')) } finally { setPending(false) }
  }
  return (
    <Sheet open={open} onClose={onClose} title={t(messages.editProfile)} description={t(messages.nameHint)} closeLabel={t(messages.cancel)}
      footer={<Button type="submit" form="account-name" variant="filled" className="min-h-14 w-full" disabled={pending} pendingLabel={pending ? t(messages.saving) : undefined}>{t(messages.save)}</Button>}>
      <form id="account-name" onSubmit={event => void save(event)} noValidate className="flex flex-col gap-4">
        <TextField label={t(messages.name)} hint={t(messages.nameHint)} autoComplete="name" leading={<UserRound className="size-5" />} maxLength={120}
          value={name} onChange={event => { setName(event.target.value); setError(null) }} error={error ?? undefined} required />
      </form>
    </Sheet>
  )
}

function PhoneSheet({ open, onClose, account, onChanged }: {
  open: boolean; onClose: () => void; account: CustomerAccountResponse; onChanged: (next: CustomerAccountResponse) => void
}) {
  const { t } = useI18n()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [challenge, setChallenge] = useState<CustomerPhoneChallengeResponse | null>(null)
  const [error, setError] = useState<{ field: 'phone' | 'code' | 'form'; text: string } | null>(null)
  const [pending, setPending] = useState(false)

  async function requestCode() {
    if (!/^[+\d][\d\s-]{7,}$/.test(phone.trim())) return setError({ field: 'phone', text: t(messages.phoneError) })
    setPending(true); setError(null)
    try {
      setChallenge(await customerRequest<CustomerPhoneChallengeResponse>('/api/customer/account/phone-challenges', { body: { phone: phone.trim() }, csrfToken: account.csrfToken }))
      setCode('')
    } catch (failure) {
      const invalid = failure instanceof CustomerApiError && failure.detail.fields?.phone === 'INVALID_FORMAT'
      setError({ field: challenge ? 'form' : 'phone', text: invalid ? t(messages.phoneError) : failureText(failure, t, 'phone') })
    } finally { setPending(false) }
  }
  async function verify() {
    if (!challenge) return
    if (code.length !== 6) return setError({ field: 'code', text: t(messages.codeError) })
    setPending(true); setError(null)
    try {
      onChanged(await customerRequest<CustomerAccountResponse>('/api/customer/account/phone-verifications', { body: { challengeId: challenge.challengeId, code }, csrfToken: account.csrfToken }))
    } catch (failure) {
      const wrong = failure instanceof CustomerApiError && failure.detail.code === 'OTP_INVALID'
      setError({ field: wrong ? 'code' : 'form', text: failureText(failure, t, 'phone') })
    } finally { setPending(false) }
  }
  function submit(event: FormEvent) { event.preventDefault(); void (challenge ? verify() : requestCode()) }

  return (
    <Sheet open={open} onClose={onClose} title={t(messages.phoneTitle)} description={t(messages.phoneIntro)} closeLabel={t(messages.cancel)}
      footer={<Button type="submit" form="account-phone" variant="filled" className="min-h-14 w-full" disabled={pending}
        pendingLabel={pending ? t(challenge ? messages.verifying : messages.sending) : undefined}>{t(challenge ? messages.verify : messages.sendCode)}</Button>}>
      <form id="account-phone" onSubmit={submit} noValidate aria-busy={pending} className="flex flex-col gap-4">
        {!challenge ? <>
          <p className="text-on-surface-variant">{t(messages.phoneIntro)}</p>
          <TextField label={t(messages.newPhone)} type="tel" inputMode="tel" autoComplete="tel" placeholder="0812 3456 7890" maxLength={50} leading={<Smartphone className="size-5" />}
            value={phone} onChange={event => { setPhone(event.target.value); setError(null) }} error={error?.field === 'phone' ? error.text : undefined} required />
        </> : <>
          <p className="text-on-surface-variant">{t(messages.codeHint, { phone: challenge.maskedPhone })}</p>
          {challenge.development === true && challenge.debugCode && <StatusPanel tone="info" title={t(messages.testHeading)}>
            <p className="text-label">{t(messages.testNotice)}</p>
            <p className="select-all text-headline font-bold tracking-[0.2em]" data-development-code>{challenge.debugCode}</p>
          </StatusPanel>}
          <CodeBoxes label={t(messages.code)} value={code} onValueChange={value => { setCode(value); setError(null) }} error={error?.field === 'code' ? error.text : undefined} required />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="text" className="-ml-3" disabled={pending} onClick={() => { setChallenge(null); setCode(''); setError(null) }}>{t(messages.otherNumber)}</Button>
            <Button type="button" variant="text" className="-mr-3" disabled={pending} onClick={() => void requestCode()}>{t(messages.resend)}</Button>
          </div>
        </>}
        {error?.field === 'form' && <StatusPanel tone="error" title={error.text} />}
      </form>
    </Sheet>
  )
}

function StatTile({ value, label, to }: { value: number; label: string; to?: string }) {
  const body = <>
    <span className="text-numeral font-bold tabular-nums">{value}</span>
    <span className="flex items-center justify-between gap-1 text-label">{label}{to && <ChevronRight aria-hidden="true" className="size-4 shrink-0" />}</span>
  </>
  const tileClass = 'flex min-h-21 flex-col justify-between gap-1 rounded-sm bg-band-tile px-4 py-3'
  return to ? <Link to={to} viewTransition data-nav="tab" className={cn(tileClass, 'state-layer pressable')}>{body}</Link> : <div className={tileClass}>{body}</div>
}

export function Component() {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { loaded, replace, retry } = useAccount()
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const [sheet, setSheet] = useState<'name' | 'phone' | null>(null)
  // Each opening starts from fresh fields: the sheet remounts under a new key.
  const [opening, setOpening] = useState(0)
  const openSheet = (which: 'name' | 'phone') => { setOpening(value => value + 1); setSheet(which) }
  const [reminder, toggleReminder] = useReminderPreference()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutFailed, setSignOutFailed] = useState(false)

  if (loaded.status === 'signedOut') return <Navigate to={`/customer/sign-in?returnTo=${encodeURIComponent('/account')}`} replace />
  if (loaded.status !== 'ready') return <>
    <CourtBand title={t(messages.heading)} />
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-3 py-4">
      {loaded.status === 'loading'
        ? <><p role="status" className="sr-only">{t(messages.loading)}</p>{[0, 1].map(key => <div key={key} aria-hidden="true" className="appear-late h-32 rounded-sm bg-surface-container" />)}</>
        : <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: retry }} />}
    </div>
  </>

  const { customer, stats } = loaded
  async function signOut() {
    setSigningOut(true); setSignOutFailed(false)
    try {
      await customerRequest('/api/customer/auth/sign-out', { body: {}, csrfToken: loaded.status === 'ready' ? loaded.csrfToken : undefined })
      toast({ message: t(messages.signedOut) })
      void navigate('/', { viewTransition: true })
    } catch { setSignOutFailed(true); setSigningOut(false) }
  }
  const editButton = isDesktop
    ? <Button variant="tonal" className="bg-surface-container-lowest" onClick={() => openSheet('name')}><Pencil aria-hidden="true" className="size-4" />{t(messages.editProfile)}</Button>
    : <IconButton label={t(messages.editProfile)} className="bg-band-tile text-on-signboard" onClick={() => openSheet('name')}><Pencil aria-hidden="true" className="size-5" /></IconButton>

  return <>
    <CourtBand>
      <div className="flex flex-col gap-4 pb-5 lg:flex-row lg:items-center lg:gap-8 lg:pb-7 lg:pt-2">
        <div className="flex min-w-0 flex-1 items-center gap-4 lg:gap-5">
          <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-headline font-bold text-on-accent lg:size-22 xl:text-display">{initialsOf(customer.displayName)}</span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h1 className="break-words text-headline font-bold xl:text-display">{customer.displayName}</h1>
            <p className="flex items-center gap-1.5 whitespace-nowrap tabular-nums">
              {displayPhone(customer.phone)}
              <BadgeCheck aria-hidden="true" className="size-5 shrink-0 text-accent" />
              <span className="sr-only">{t(messages.verified)}</span>
            </p>
          </div>
          {!isDesktop && editButton}
        </div>
        <div className="grid grid-cols-2 gap-2 lg:w-[18rem] lg:shrink-0 xl:w-[22rem]">
          <StatTile value={stats.sessionsPlayed} label={t(messages.played)} />
          <StatTile value={stats.activeBookings} label={t(messages.active)} to="/bookings" />
        </div>
        {isDesktop && editButton}
      </div>
    </CourtBand>
    <div className="page-gutter desk-column mx-auto flex w-full max-w-[50rem] flex-col gap-6 py-5 lg:max-w-none lg:pt-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Section title={t(messages.settings)}>
          <li><SettingRow icon={<MessageCircle className="size-5" />} label={t(messages.reminder)} hint={t(messages.reminderHint)}
            trailing={<ReminderSwitch on={reminder} onToggle={toggleReminder} label={t(messages.reminder)} />} /></li>
          <li><SettingRow icon={<Languages className="size-5" />} label={t(messages.language)} trailing={<LanguageChoice />} /></li>
          <li><SettingRow icon={<Smartphone className="size-5" />} label={t(messages.changePhone)} hint={displayPhone(customer.phone)} onClick={() => openSheet('phone')} /></li>
        </Section>
        <div className="flex flex-col gap-6">
          <Section title={t(messages.help)}>
            {clubContent.whatsapp && <li><SettingRow icon={<MessageCircle className="size-5" />} label={t(messages.chatAdmin)} href={`https://wa.me/${clubContent.whatsapp}`} /></li>}
            <li><SettingRow icon={<Info className="size-5" />} label={t(messages.about)} to="/" /></li>
          </Section>
          <div className="flex flex-col gap-2">
            <ul className="overflow-hidden rounded-sm bg-surface-container-lowest">
              <li><SettingRow icon={<LogOut className="size-5" />} label={signingOut ? t(messages.signingOut) : t(messages.signOut)} danger onClick={signingOut ? undefined : () => void signOut()} /></li>
            </ul>
            {signOutFailed && <StatusPanel tone="error" title={t(messages.signOutFailed)} />}
          </div>
        </div>
      </div>
    </div>
    <NameSheet key={`name-${opening}`} open={sheet === 'name'} onClose={() => setSheet(null)} account={loaded}
      onSaved={next => { replace(next); setSheet(null); toast({ message: t(messages.nameSaved) }) }} />
    <PhoneSheet key={`phone-${opening}`} open={sheet === 'phone'} onClose={() => setSheet(null)} account={loaded}
      onChanged={next => { replace(next); setSheet(null); toast({ message: t(messages.phoneChanged) }) }} />
  </>
}
