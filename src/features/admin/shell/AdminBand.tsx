import type { ReactNode } from 'react'
import { ChevronLeft, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CourtLines } from '@/components/brand/court-lines'
import { Wordmark } from '@/components/brand/ball-mark'
import { LanguageMenu } from '@/components/ui/language-switch'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { clubContent } from '@/features/public/club/club-content'
import { authMessages } from '../auth/auth.messages'
import { shellMessages } from './shell.messages'
import { useAdminShell } from './admin-shell-context'

interface AdminBandProps {
  title: string
  // Screens opened from a list carry a round back button and the list's name instead of the wordmark row.
  back?: { to: string; label: string }
  // A short line under the title, in white.
  subtitle?: ReactNode
  // Sits at the end of the title row.
  action?: ReactNode
  children?: ReactNode
}

// The admin's court-blue band, the same family as the member screens: wordmark with an Admin chip, language and
// sign-out on the top row, then the headline and whatever the screen keeps on blue (date tiles, tabs, fact tiles).
export function AdminBand({ title, back, subtitle, action, children }: AdminBandProps) {
  const { t } = useI18n()
  const { signOut, signingOut } = useAdminShell()
  return (
    <header className="relative isolate overflow-hidden rounded-b-lg bg-band pt-[env(safe-area-inset-top)] text-on-signboard [&_:focus-visible]:outline-white lg:mx-auto lg:mt-5 lg:w-[min(calc(100%-64px),calc(72rem-64px))] lg:rounded-lg lg:pt-1">
      <CourtLines className="pointer-events-none absolute -right-12 -top-4 -z-10 h-64 text-on-signboard/15 sm:right-8" />
      <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col pb-4 lg:max-w-none lg:px-8 lg:pb-6">
        <div className="flex h-14 items-center justify-between gap-3">
          {back ? (
            <Link to={back.to} viewTransition className="pressable -ml-1 flex min-h-12 items-center gap-3 rounded-full pr-3 text-label">
              <span className="flex size-12 items-center justify-center rounded-full bg-band-tile"><ChevronLeft aria-hidden="true" className="size-6" /></span>
              {back.label}
            </Link>
          ) : (
            <p className="flex items-center gap-2" aria-label={`${clubContent.name} ${t(shellMessages.admin)}`}>
              <Wordmark name={clubContent.shortName} />
              <span aria-hidden="true" className="rounded-full bg-band-tile px-2.5 py-0.5 text-label font-semibold">{t(shellMessages.admin)}</span>
            </p>
          )}
          <div className="-mr-3 flex items-center">
            <LanguageMenu />
            <button type="button" onClick={signOut} disabled={signingOut} aria-label={t(signingOut ? authMessages.signingOut : authMessages.signOut)}
              className="state-layer pressable flex size-12 items-center justify-center rounded-full disabled:opacity-60">
              <LogOut aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
        <div className={cn('flex min-h-12 items-center justify-between gap-3', back && 'pt-1')}>
          <h1 className="min-w-0 break-words text-headline font-bold leading-tight lg:text-display">{title}</h1>
          {action}
        </div>
        {subtitle && <div className="mt-1">{subtitle}</div>}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </header>
  )
}
