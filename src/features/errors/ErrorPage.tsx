import { Link, useLocation } from 'react-router-dom'
import { BallMark } from '@/components/brand/ball-mark'
import { Button } from '@/components/ui/button'
import { LanguageMenu } from '@/components/ui/language-switch'
import { useI18n } from '@/i18n/use-i18n'
import type { Message } from '@/i18n/types'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { clubContent } from '@/features/public/club/club-content'
import { errorPageMessages as messages } from './error-page.messages'

export type ErrorCode = 401 | 403 | 404 | 500
export type ErrorAudience = 'member' | 'admin'
interface ErrorAction { label: Message; to?: string; onClick?: () => void }

// The code's middle digit is always the ball (404, 500, 401, 403).
const DIGITS: Record<ErrorCode, [string, string]> = { 404: ['4', '4'], 500: ['5', '0'], 401: ['4', '1'], 403: ['4', '3'] }
const TAG_TONE: Record<ErrorCode, string> = {
  404: 'bg-primary-container text-primary',
  500: 'bg-error-container text-error',
  401: 'bg-warning-container text-warning',
  403: 'bg-error-container text-error',
}

function signInPath(audience: ErrorAudience, returnTo: string) {
  return audience === 'admin' ? '/admin/sign-in' : `/customer/sign-in?returnTo=${encodeURIComponent(returnTo)}`
}

function defaultActions(code: ErrorCode, audience: ErrorAudience, returnTo: string): [ErrorAction, ErrorAction] {
  const reload = { label: messages.retry, onClick: () => window.location.reload() }
  if (audience === 'admin') {
    if (code === 500) return [reload, { label: messages.sessions, to: '/admin/sessions' }]
    if (code === 401) return [{ label: messages.signIn, to: signInPath(audience, returnTo) }, { label: messages.schedule, to: '/schedule' }]
    return [{ label: messages.sessions, to: '/admin/sessions' }, { label: messages.adminBookings, to: '/admin/bookings' }]
  }
  switch (code) {
    case 404: return [{ label: messages.schedule, to: '/schedule' }, { label: messages.club, to: '/' }]
    case 500: return [reload, { label: messages.bookings, to: '/bookings' }]
    case 401: return [{ label: messages.signIn, to: signInPath(audience, returnTo) }, { label: messages.schedule, to: '/schedule' }]
    case 403: return [{ label: messages.home, to: '/' }, { label: messages.schedule, to: '/schedule' }]
  }
}

// The code in large court numerals; a tennis ball stands in for the middle digit and drops in once.
function CodeArt({ code }: { code: ErrorCode }) {
  const [first, last] = DIGITS[code]
  return (
    <span aria-hidden="true" className="error-code flex items-end gap-[0.05em] font-bold tabular-nums">
      <span>{first}</span>
      <span className="flex h-[0.8em] w-[0.62em] flex-col items-center justify-end">
        <svg viewBox="0 0 100 100" className="error-ball block size-[0.6em]">
          <circle cx="50" cy="50" r="47" className="fill-accent" />
          <path d="M18 16c18 18 18 50 0 68M82 16c-18 18-18 50 0 68" fill="none" className="stroke-white" strokeWidth="6" strokeLinecap="round" />
        </svg>
        <span className="error-ball-shadow mt-[0.04em] block h-[0.06em] w-[0.5em] rounded-[50%] bg-band-tile" />
      </span>
      <span>{last}</span>
    </span>
  )
}

function CourtArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="3" className="pointer-events-none absolute inset-0 -z-10 size-full text-on-signboard/18">
      <rect x="40" y="40" width="520" height="320" />
      <path d="M40 90h520M40 310h520M300 90v220M170 90v220M430 90v220M170 200h260" />
    </svg>
  )
}

function ClubMark({ onBand }: { onBand: boolean }) {
  const { t } = useI18n()
  return (
    <Link to="/" aria-label={t(messages.clubLabel)} className={cn('flex min-h-12 items-center gap-2.5', onBand ? 'text-on-signboard' : 'text-on-surface')}>
      <BallMark className={onBand ? 'text-white' : 'size-7 text-band'} seamClassName={onBand ? 'stroke-band-tile' : 'stroke-white'} />
      <span className="text-body font-bold uppercase leading-none tracking-[0.16em]">{clubContent.shortName}</span>
    </Link>
  )
}

interface ErrorPageProps {
  code: ErrorCode
  audience?: ErrorAudience
  // Inside the admin shell the rail or band already carries the mark and language, so the page drops its own row.
  header?: boolean
  // Standalone pages fill the screen; inside the app layout (dock or rail) the page keeps its natural height.
  fill?: boolean
  // 500 only: the code written to the server log (see report-client-error.ts).
  reportCode?: string
  actions?: [ErrorAction, ErrorAction]
}

// The whole-page states (G1 "Can the whole page not be shown?"): boards E1-E4 on desktop, E1m-E4m on phones.
export function ErrorPage({ code, audience = 'member', header = true, fill = true, reportCode, actions }: ErrorPageProps) {
  const { t } = useI18n()
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const copy = messages[audience][code]
  const [primary, secondary] = actions ?? defaultActions(code, audience, location.pathname + location.search)
  const button = (action: ErrorAction, variant: 'filled' | 'outlined') => (
    <Button asChild={Boolean(action.to)} variant={variant} onClick={action.onClick}
      className={cn('min-h-13 w-full text-body font-semibold lg:min-h-14 lg:w-auto lg:px-7', variant === 'outlined' && 'border-outline-variant bg-surface-container-lowest')}>
      {action.to ? <Link to={action.to}>{t(action.label)}</Link> : t(action.label)}
    </Button>
  )

  return (
    <div className={cn('flex flex-col bg-surface text-on-surface', fill && 'min-h-dvh')}>
      {header && isDesktop && (
        <header className="mx-auto flex h-20 w-full max-w-[77.5rem] items-center justify-between gap-4 px-10">
          <ClubMark onBand={false} />
          <LanguageMenu className="border border-outline-variant bg-surface-container-lowest text-on-surface" />
        </header>
      )}
      <main className={cn('flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[77.5rem] lg:flex-row lg:flex-wrap lg:items-stretch lg:gap-6 lg:px-10 lg:pb-12', header ? 'lg:pt-2' : 'lg:pt-5')}>
        <div className="relative isolate flex h-[24.5rem] flex-none flex-col overflow-hidden rounded-b-lg bg-band pt-[env(safe-area-inset-top)] text-on-signboard lg:h-auto lg:min-h-[26rem] lg:flex-[1_1_28rem] lg:rounded-lg lg:pt-0">
          <CourtArt />
          {header && !isDesktop && (
            <div className="flex h-14 items-center justify-between px-4 pt-3 [&_:focus-visible]:outline-white">
              <ClubMark onBand />
              <LanguageMenu className="bg-band-tile" />
            </div>
          )}
          <div className="flex flex-1 items-center justify-center"><CodeArt code={code} /></div>
        </div>

        <section aria-labelledby="error-title" className="error-in flex flex-1 flex-col gap-3 px-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-6 lg:flex-[1_1_26rem] lg:justify-center lg:gap-5 lg:rounded-lg lg:bg-surface-container-lowest lg:p-14">
          <span className={cn('self-start rounded-full px-3 py-0.5 text-label font-bold', TAG_TONE[code])}>{t(copy.tag)}</span>
          <div className="flex flex-col gap-2.5">
            <h1 id="error-title" className="text-headline font-bold lg:text-display">{t(copy.title)}</h1>
            <p className="max-w-[32rem] text-on-surface-variant">{t(copy.body)}</p>
          </div>
          {reportCode && (
            <dl className="flex justify-between gap-3 rounded-sm bg-surface-container-lowest px-3.5 py-3 text-label lg:bg-surface-container">
              <dt className="text-on-surface-variant">{t(messages.reportCode)}</dt>
              <dd className="font-bold tabular-nums">{reportCode}</dd>
            </dl>
          )}
          <div className="mt-auto flex flex-col gap-2 pt-3 lg:mt-0 lg:flex-row lg:flex-wrap lg:gap-3 lg:pt-0">
            {button(primary, 'filled')}
            {button(secondary, 'outlined')}
          </div>
          {reportCode && <p className="text-label text-on-surface-variant">{t(audience === 'admin' ? messages.reportHintAdmin : messages.reportHint)}</p>}
        </section>
      </main>
    </div>
  )
}
