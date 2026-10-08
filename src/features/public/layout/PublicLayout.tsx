import { CalendarDays, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { m, useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LanguageMenu } from '@/components/ui/language-switch'
import { useI18n } from '@/i18n/use-i18n'
import type { Message } from '@/i18n/types'
import { selectionHaptic } from '@/lib/haptics'
import { selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { clubContent } from '../club/club-content'
import { publicMessages } from './public.messages'

const destinations: { to: string; end: boolean; label: Message; Icon: LucideIcon }[] = [
  { to: '/', end: true, label: publicMessages.schedule, Icon: CalendarDays },
  { to: '/club', end: false, label: publicMessages.club, Icon: Info },
]

// One destination: icon inside the Material active-indicator pill, label beneath. Bar on phones, rail from 640px.
// The pill is a single shared element, so it slides from the old tab to the new one instead of blinking.
function Destination({ to, end, label, Icon }: (typeof destinations)[number]) {
  const { t } = useI18n()
  return (
    <NavLink
      to={to}
      end={end}
      viewTransition
      onClick={event => {
        const isCurrent = event.currentTarget.getAttribute('aria-current') === 'page'
        // Native habit: tapping the tab you are already on returns to the top of it.
        if (isCurrent) { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }
        else selectionHaptic()
      }}
      className="group flex min-h-16 flex-1 flex-col items-center justify-center gap-1 py-2 sm:min-h-0 sm:flex-none sm:py-0"
    >
      {({ isActive }) => (
        <>
          <span className="pressable relative flex h-8 w-16 items-center justify-center">
            {isActive && (
              <m.span layoutId="nav-indicator" transition={selectionSpring} className="absolute inset-0 rounded-full bg-secondary-container" />
            )}
            <span className="state-layer absolute inset-0 rounded-full" />
            <Icon aria-hidden="true" className={cn('relative size-6 transition-colors duration-200', isActive ? 'text-on-secondary-container' : 'text-on-surface-variant')} strokeWidth={isActive ? 2.5 : 2} />
          </span>
          <span className={cn('text-label transition-colors duration-200', isActive ? 'font-bold text-on-surface' : 'text-on-surface-variant')}>{t(label)}</span>
        </>
      )}
    </NavLink>
  )
}

export function PublicLayout() {
  const { t } = useI18n()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', value => setScrolled(value > 4))

  return (
    <div className="min-h-dvh bg-surface">
      {/* Signboard app bar: the club's green trail board. Focus turns white here because green would vanish on it. */}
      <header className={cn(
        'sticky top-0 z-30 bg-signboard pt-[env(safe-area-inset-top)] text-on-signboard transition-shadow duration-200 [view-transition-name:app-bar] [&_:focus-visible]:outline-white',
        scrolled && 'shadow-bar',
      )}>
        <div className="sm:pl-20"><div className="page-gutter mx-auto flex h-16 w-full max-w-[50rem] items-center justify-between gap-3 lg:max-w-[72rem]">
          {/* Text identity until the club supplies a logo (R-23); no image is invented. */}
          <p className="flex min-w-0 items-baseline gap-3">
            <span className="font-display text-headline font-bold uppercase leading-none tracking-wide">{clubContent.shortName}</span>
            <span className="truncate text-label text-on-signboard-variant">{clubContent.name}</span>
          </p>
          <LanguageMenu className="-mr-3" />
        </div></div>
      </header>

      <main className="pb-[calc(5rem+env(safe-area-inset-bottom)+1rem)] sm:pb-8 sm:pl-20">
        <Outlet />
      </main>

      <nav
        aria-label={t(publicMessages.navLabel)}
        className="fixed inset-x-0 bottom-0 z-30 flex bg-surface-container pb-[env(safe-area-inset-bottom)] [view-transition-name:nav-bar] sm:inset-x-auto sm:bottom-0 sm:left-0 sm:top-[calc(4rem+env(safe-area-inset-top))] sm:w-20 sm:flex-col sm:items-center sm:gap-3 sm:pb-0 sm:pt-4"
      >
        {destinations.map(destination => <Destination key={destination.to} {...destination} />)}
      </nav>
    </div>
  )
}
