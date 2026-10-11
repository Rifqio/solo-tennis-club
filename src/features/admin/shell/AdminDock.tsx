import { LogOut, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { m } from 'motion/react'
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { isClubDate } from '@shared/club-time'
import { BallMark } from '@/components/brand/ball-mark'
import { LanguageMenu } from '@/components/ui/language-switch'
import { useI18n } from '@/i18n/use-i18n'
import type { Message } from '@/i18n/types'
import { selectionHaptic } from '@/lib/haptics'
import { popSpring, selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { adminNavLeading, adminNavTrailing } from './admin-nav'
import { authMessages } from '../auth/auth.messages'
import { shellMessages } from './shell.messages'
import { useAdminShell } from './admin-shell-context'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Destination { to: string; label: Message; Icon: LucideIcon; also: string[] }

function Tab({ to, label, Icon, also }: Destination) {
  const { t } = useI18n()
  const { pathname } = useLocation()
  // `/admin` itself opens Sesi, but only exactly: as a prefix it would match every admin screen.
  const active = pathname === to || pathname.startsWith(to + '/')
    || also.some(path => pathname === path || (path !== '/admin' && pathname.startsWith(path + '/')))
  return (
    // Always a section switch (a short crossfade), whatever the depth of the screen it leaves. The open screen itself
    // does not reload: tapping it scrolls back to the top.
    <Link to={to} viewTransition data-nav="tab" aria-current={active ? 'page' : undefined}
      onClick={event => {
        if (pathname === to) { event.preventDefault(); window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); return }
        if (!active) selectionHaptic()
      }}
      className="pressable relative isolate flex min-h-16 flex-col items-center justify-center gap-0.5 sm:w-[4.5rem] lg:w-20">
      {/* Rail (from 640px, board D9b): the open screen sits on a raised ink tile that glides between items. */}
      {active && <m.span layoutId="admin-rail-tile" transition={selectionSpring} aria-hidden="true" className="absolute inset-0 -z-10 hidden rounded-[1rem] bg-ink-raised sm:block" />}
      <Icon aria-hidden="true" className={cn('size-6 transition-colors duration-200', active ? 'text-accent sm:text-on-ink' : 'text-on-ink-variant')} strokeWidth={active ? 2.25 : 2} />
      <span className={cn('text-label transition-colors duration-200', active ? 'font-semibold text-on-ink' : 'text-on-ink-variant')}>{t(label)}</span>
      <span className="flex h-1 w-1 items-center justify-center sm:hidden">
        {active && <m.span layoutId="admin-dock-dot" transition={selectionSpring} className="size-1 rounded-full bg-accent" />}
      </span>
    </Link>
  )
}

// The member dock's ink bar, for admins: Sesi and Booking on the left, Tambah sesi raised into the notch, Kelas and
// Kelola on the right. From 640px it becomes a left rail: the club mark, Tambah sesi, the screens, then language and
// sign-out at its foot, so the bands above each screen carry only the screen itself.
export function AdminDock() {
  const { t } = useI18n()
  const { signOut, signingOut } = useAdminShell()
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  // A new session starts on the day the admin is looking at.
  const date = pathname.startsWith('/admin/sessions') && isClubDate(params.get('date')) ? params.get('date') : null
  return (
    <nav aria-label={t(shellMessages.navLabel)}
      data-bottom-chrome className="fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] [view-transition-name:nav-bar] [&_:focus-visible]:outline-accent sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:w-20 sm:pb-0 lg:w-24">
      <div aria-hidden="true" className="dock-notch absolute inset-0 rounded-t-lg bg-dock sm:rounded-none" />
      <div className="relative grid h-18 grid-cols-[1fr_1fr_5.5rem_1fr_1fr] sm:flex sm:h-full sm:flex-col sm:items-center sm:gap-2 sm:pb-4 sm:pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <span className="hidden flex-col items-center gap-1.5 sm:order-first sm:flex">
          <BallMark className="size-8 text-on-ink" seamClassName="stroke-ink" />
          <span className="rounded-full bg-ink-raised px-2 text-label font-semibold text-on-ink">{t(shellMessages.admin)}</span>
        </span>
        {adminNavLeading.map(item => <Tab key={item.to} {...item} />)}
        <NavLink to={`/admin/sessions/new${date ? `?date=${date}` : ''}`} viewTransition onClick={() => selectionHaptic()}
          className="group flex flex-col items-center gap-1 outline-none sm:order-first sm:mb-3 sm:mt-3">
          {/* The raise sits on the outer span so the press scale on the inner one does not fight it. */}
          <span className="flex -translate-y-6 sm:translate-y-0">
            <m.span whileTap={{ scale: 0.94 }} transition={popSpring}
              className="state-layer flex size-16 items-center justify-center rounded-full bg-accent text-on-accent shadow-fab group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-accent sm:size-14 sm:shadow-none">
              <Plus aria-hidden="true" className="size-7" strokeWidth={2.5} />
            </m.span>
          </span>
          <span className="-mt-6 text-center text-label font-semibold leading-tight text-on-ink sm:mt-0 sm:max-w-18">{t(shellMessages.addSession)}</span>
        </NavLink>
        {adminNavTrailing.map(item => <Tab key={item.to} {...item} />)}
        <span className="hidden flex-col items-center gap-1 sm:mt-auto sm:flex">
          <LanguageMenu className="text-on-ink" />
          <button type="button" onClick={signOut} disabled={signingOut} aria-label={t(signingOut ? authMessages.signingOut : authMessages.signOut)}
            className="state-layer pressable flex size-12 items-center justify-center rounded-full text-on-ink-variant disabled:opacity-60">
            <LogOut aria-hidden="true" className="size-5" />
          </button>
        </span>
      </div>
    </nav>
  )
}
