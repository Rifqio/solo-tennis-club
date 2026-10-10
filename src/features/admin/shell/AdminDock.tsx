import { Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { m } from 'motion/react'
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { isClubDate } from '@shared/club-time'
import { useI18n } from '@/i18n/use-i18n'
import type { Message } from '@/i18n/types'
import { selectionHaptic } from '@/lib/haptics'
import { selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { adminNavLeading, adminNavTrailing } from './admin-nav'
import { shellMessages } from './shell.messages'

interface Destination { to: string; label: Message; Icon: LucideIcon; also: string[] }

function Tab({ to, label, Icon, also }: Destination) {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const active = pathname === to || pathname.startsWith(to + '/') || also.some(path => pathname === path || pathname.startsWith(path + '/'))
  return (
    <Link to={to} viewTransition aria-current={active ? 'page' : undefined} onClick={() => { if (!active) selectionHaptic() }}
      className="pressable flex min-h-16 flex-col items-center justify-center gap-0.5 sm:w-full">
      <Icon aria-hidden="true" className={cn('size-6 transition-colors duration-200', active ? 'text-accent' : 'text-on-ink-variant')} strokeWidth={active ? 2.25 : 2} />
      <span className={cn('text-label transition-colors duration-200', active ? 'font-semibold text-on-ink' : 'text-on-ink-variant')}>{t(label)}</span>
      <span className="flex h-1 w-1 items-center justify-center">
        {active && <m.span layoutId="admin-dock-dot" transition={selectionSpring} className="size-1 rounded-full bg-accent" />}
      </span>
    </Link>
  )
}

// The member dock's ink bar, for admins: Sesi and Booking on the left, Tambah sesi raised into the notch, Kelas and
// Kelola on the right. From 640px it becomes a left rail with Tambah sesi at the top.
export function AdminDock() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  // A new session starts on the day the admin is looking at.
  const date = pathname.startsWith('/admin/sessions') && isClubDate(params.get('date')) ? params.get('date') : null
  return (
    <nav aria-label={t(shellMessages.navLabel)}
      className="fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] [view-transition-name:nav-bar] [&_:focus-visible]:outline-accent sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:w-20 sm:pb-0">
      <div aria-hidden="true" className="dock-notch absolute inset-0 rounded-t-lg bg-dock sm:rounded-none" />
      <div className="relative grid h-18 grid-cols-[1fr_1fr_5.5rem_1fr_1fr] sm:flex sm:h-auto sm:flex-col sm:items-center sm:gap-2 sm:pt-[calc(1rem+env(safe-area-inset-top))]">
        {adminNavLeading.map(item => <Tab key={item.to} {...item} />)}
        <NavLink to={`/admin/sessions/new${date ? `?date=${date}` : ''}`} viewTransition onClick={() => selectionHaptic()}
          className="group flex flex-col items-center gap-1 outline-none sm:order-first sm:mb-3">
          <span className="state-layer flex size-16 -translate-y-6 items-center justify-center rounded-full bg-accent text-on-accent shadow-fab group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-accent sm:size-14 sm:translate-y-0 sm:shadow-none">
            <Plus aria-hidden="true" className="size-7" strokeWidth={2.5} />
          </span>
          <span className="-mt-6 text-center text-label font-semibold leading-tight text-on-ink sm:mt-0">{t(shellMessages.addSession)}</span>
        </NavLink>
        {adminNavTrailing.map(item => <Tab key={item.to} {...item} />)}
      </div>
    </nav>
  )
}
