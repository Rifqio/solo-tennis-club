import { CalendarDays, Info, Plus, Ticket, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { m } from 'motion/react'
import { NavLink } from 'react-router-dom'
import { useI18n } from '@/i18n/use-i18n'
import type { Message } from '@/i18n/types'
import { selectionHaptic } from '@/lib/haptics'
import { popSpring, selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { publicMessages } from './public.messages'

interface DockDestination { to: string; end: boolean; label: Message; Icon: LucideIcon; className?: string }

const leading: DockDestination[] = [
  { to: '/schedule', end: false, label: publicMessages.schedule, Icon: CalendarDays },
  { to: '/', end: true, label: publicMessages.club, Icon: Info },
]
const trailing: DockDestination[] = [
  { to: '/bookings', end: false, label: publicMessages.bookings, Icon: Ticket },
  { to: '/customer/sign-in', end: false, label: publicMessages.account, Icon: UserRound },
]

// One destination: a 24px icon over its label. Active is a lime icon with a lime dot that springs between tabs.
function Destination({ to, end, label, Icon, className }: DockDestination) {
  const { t } = useI18n()
  return (
    <NavLink
      to={to}
      end={end}
      viewTransition
      onClick={event => {
        // Native habit: tapping the tab you are already on returns to the top of it.
        if (event.currentTarget.getAttribute('aria-current') === 'page') { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }
        else selectionHaptic()
      }}
      className={cn('pressable flex min-h-16 flex-col items-center justify-center gap-0.5 sm:w-full sm:flex-none', className)}
    >
      {({ isActive }) => (
        <>
          <Icon aria-hidden="true" className={cn('size-6 transition-colors duration-200', isActive ? 'text-accent' : 'text-on-ink-variant')} strokeWidth={isActive ? 2.25 : 2} />
          <span className={cn('text-label transition-colors duration-200', isActive ? 'font-semibold text-on-ink' : 'text-on-ink-variant')}>{t(label)}</span>
          <span className="flex h-1 w-1 items-center justify-center">
            {isActive && <m.span layoutId="dock-dot" transition={selectionSpring} className="size-1 rounded-full bg-accent" />}
          </span>
        </>
      )}
    </NavLink>
  )
}

// The book button: a lime circle raised into the dock's notch on phones, the first item of the rail from 640px.
function BookButton({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n()
  return (
    <m.button
      type="button"
      onClick={() => { selectionHaptic(); onOpen() }}
      whileTap={{ scale: 0.94 }}
      transition={popSpring}
      aria-haspopup="dialog"
      className="group flex flex-col items-center gap-1 outline-none sm:order-first sm:mb-3"
    >
      <span className="state-layer flex size-16 -translate-y-6 items-center justify-center rounded-full bg-accent text-on-accent shadow-fab group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-accent sm:size-14 sm:translate-y-0 sm:shadow-none">
        <Plus aria-hidden="true" className="size-7" strokeWidth={2.5} />
      </span>
      <span className="-mt-6 text-label font-semibold text-on-ink sm:mt-0">{t(publicMessages.book)}</span>
    </m.button>
  )
}

// After the padel bottom menu, in ink: Jadwal and Klub on the left, the book button in a notch at the centre, account
// on the right. From 640px it becomes a left rail with the book button at the top.
export function Dock({ onBook }: { onBook: () => void }) {
  const { t } = useI18n()
  return (
    <nav
      aria-label={t(publicMessages.navLabel)}
      className="fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] [view-transition-name:nav-bar] [&_:focus-visible]:outline-accent sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:w-20 sm:pb-0"
    >
      <div aria-hidden="true" className="dock-notch absolute inset-0 rounded-t-lg bg-dock sm:rounded-none" />
      <div className="relative grid h-18 grid-cols-[1fr_1fr_5.5rem_1fr_1fr] sm:flex sm:h-auto sm:flex-col sm:items-center sm:gap-2 sm:pt-[calc(1rem+env(safe-area-inset-top))]">
        {leading.map(destination => <Destination key={destination.to} {...destination} />)}
        <BookButton onOpen={onBook} />
        {trailing.map(destination => <Destination key={destination.to} {...destination} />)}
      </div>
    </nav>
  )
}
