import type { ReactNode } from 'react'
import { ChevronLeft, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CourtLines } from '@/components/brand/court-lines'
import { Wordmark } from '@/components/brand/ball-mark'
import { LanguageMenu } from '@/components/ui/language-switch'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/use-media-query'
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
  // Desktop: the children take a full-width row under the title (the Sesi date strip) instead of the right column.
  wideChildren?: boolean
}

// The admin's court-blue band, the same family as the member screens. Phones: wordmark with an Admin chip, language
// and sign-out on the top row, then the headline and whatever the screen keeps on blue (date tiles, tabs, fact tiles).
// From 640px the rail carries the mark, language and sign-out, so the band keeps only a back link when there is one.
// From 1024px (boards D9b, D10) the band is a card in the shared admin column: title and subtitle on the left, the
// action and tabs on the right.
// The band is named app-bar for view transitions, so it holds still while the page under it moves (index.css), and
// the back link always pops, even to a screen at the same URL depth (the booking form back to its roster).
export function AdminBand({ title, back, subtitle, action, children, wideChildren = false }: AdminBandProps) {
  const { t } = useI18n()
  const { signOut, signingOut } = useAdminShell()
  // The action renders once: beside the title on phones and tablets, in the right column from 1024px.
  const wide = useMediaQuery('(min-width: 64rem)')
  return (
    <header className="relative isolate overflow-hidden rounded-b-lg bg-band pt-[env(safe-area-inset-top)] [view-transition-name:app-bar] text-on-signboard [&_:focus-visible]:outline-white desk-column lg:mt-5 lg:rounded-lg lg:pt-0">
      <CourtLines className="pointer-events-none absolute -right-12 -top-4 -z-10 h-64 text-on-signboard/15 sm:right-8" />
      <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col pb-4 sm:pt-4 lg:max-w-none lg:px-8 lg:py-5">
        <div className={cn('flex h-14 items-center justify-between gap-3', !back && 'sm:hidden')}>
          {back ? (
            <Link to={back.to} viewTransition data-nav="pop" className="pressable -ml-1 flex min-h-12 items-center gap-3 rounded-full pr-3 text-label">
              <span className="flex size-12 items-center justify-center rounded-full bg-band-tile"><ChevronLeft aria-hidden="true" className="size-6" /></span>
              {back.label}
            </Link>
          ) : (
            <p className="flex items-center gap-2" aria-label={`${clubContent.name} ${t(shellMessages.admin)}`}>
              <Wordmark name={clubContent.shortName} />
              <span aria-hidden="true" className="rounded-full bg-band-tile px-2.5 py-0.5 text-label font-semibold">{t(shellMessages.admin)}</span>
            </p>
          )}
          <div className="-mr-3 flex items-center sm:hidden">
            <LanguageMenu />
            <button type="button" onClick={signOut} disabled={signingOut} aria-label={t(signingOut ? authMessages.signingOut : authMessages.signOut)}
              className="state-layer pressable flex size-12 items-center justify-center rounded-full disabled:opacity-60">
              <LogOut aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-end lg:justify-between lg:gap-x-6 lg:gap-y-4">
          <div className="flex min-w-0 flex-col lg:flex-1">
            <div className={cn('flex min-h-12 items-center justify-between gap-3', back && 'pt-1')}>
              <h1 className="min-w-0 break-words text-headline font-bold leading-tight lg:text-display">{title}</h1>
              {!wide && action}
            </div>
            {subtitle && <div className="mt-1 lg:mt-0.5">{subtitle}</div>}
          </div>
          {((wide && action) || (children && !wideChildren)) && <div className={cn('flex min-w-0 flex-col gap-3 lg:mt-0 lg:items-end', !wideChildren && 'mt-3')}>
            {wide && action}
            {!wideChildren && children}
          </div>}
        </div>
        {wideChildren && children && <div className="mt-3 lg:mt-5">{children}</div>}
      </div>
    </header>
  )
}
