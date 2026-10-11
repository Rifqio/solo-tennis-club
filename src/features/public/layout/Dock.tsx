import { CalendarDays, Info, LogOut, Plus, Ticket, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { m } from 'motion/react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BallMark } from '@/components/brand/ball-mark'
import { LanguageMenu } from '@/components/ui/language-switch'
import { useToast } from '@/components/ui/use-toast'
import { clubContent } from '@/features/public/club/club-content'
import { customerRequest } from '@/lib/customer-api'
import { useMediaQuery } from '@/lib/use-media-query'
import { useI18n } from '@/i18n/use-i18n'
import type { Message } from '@/i18n/types'
import { selectionHaptic } from '@/lib/haptics'
import { popSpring, selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { publicMessages } from './public.messages'
import { initialsOf, useMemberSession } from './use-member-session'

interface DockDestination { to: string; end: boolean; label: Message; Icon: LucideIcon; className?: string; initials?: string }

const leading: DockDestination[] = [
  { to: '/schedule', end: false, label: publicMessages.schedule, Icon: CalendarDays },
  { to: '/', end: true, label: publicMessages.club, Icon: Info },
]
const trailing: DockDestination[] = [
  { to: '/bookings', end: false, label: publicMessages.bookings, Icon: Ticket },
  { to: '/account', end: false, label: publicMessages.account, Icon: UserRound },
]

// One destination: a 24px icon over its label. Active is a lime icon with a lime dot that springs between tabs.
function Destination({ to, end, label, Icon, className, initials }: DockDestination) {
  const { t } = useI18n()
  return (
    <NavLink
      to={to}
      end={end}
      viewTransition
      // Always a section switch (a short crossfade), whatever the URL depth of either screen.
      data-nav="tab"
      onClick={event => {
        // Native habit: tapping the tab you are already on returns to the top of it.
        if (event.currentTarget.getAttribute('aria-current') === 'page') {
          event.preventDefault()
          window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
        }
        else selectionHaptic()
      }}
      className={cn('pressable flex min-h-16 flex-col items-center justify-center gap-0.5 sm:w-full sm:flex-none', className)}
    >
      {({ isActive }) => (
        <>
          {/* Signed in, Akun shows the member's initials in lime instead of the generic person. */}
          {initials
            ? <span aria-hidden="true" className={cn('flex size-7 items-center justify-center rounded-full bg-accent text-label font-bold leading-none tracking-tight text-on-accent transition-shadow duration-200', isActive && 'ring-2 ring-accent ring-offset-2 ring-offset-dock')}>{initials}</span>
            : <Icon aria-hidden="true" className={cn('size-6 transition-colors duration-200', isActive ? 'text-accent' : 'text-on-ink-variant')} strokeWidth={isActive ? 2.25 : 2} />}
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
      data-bottom-chrome
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

// Phones: the padel bottom menu in ink, Jadwal and Klub on the left, the book button in a notch at the centre,
// bookings and account on the right. The club page lives inside the app there, so Klub is a tab.
// From 640px: a left rail of tasks only. The club's mark at the top is the way home (the desktop home page is the
// club's front page, outside the app), then Pesan, Jadwal, Booking and Akun; language and Keluar sit at the foot.
export function Dock({ onBook }: { onBook: () => void }) {
  const { t } = useI18n()
  const isRail = useMediaQuery('(min-width: 40rem)')
  const member = useMemberSession()
  const initials = member.session ? initialsOf(member.session.customer.displayName) : undefined
  const account = { ...trailing[1], initials }
  return (
    <nav
      aria-label={t(publicMessages.navLabel)}
      data-bottom-chrome className="fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] [view-transition-name:nav-bar] [&_:focus-visible]:outline-accent sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:w-20 sm:pb-0"
    >
      <div aria-hidden="true" className="dock-notch absolute inset-0 rounded-t-lg bg-dock sm:rounded-none" />
      {isRail ? (
        <div className="relative flex h-full flex-col items-center gap-2 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <Link to="/" viewTransition aria-label={t(publicMessages.home, { club: clubContent.name })} title={t(publicMessages.home, { club: clubContent.name })}
            className="pressable flex size-12 items-center justify-center rounded-full">
            <BallMark className="size-8 text-band" seamClassName="stroke-on-signboard" />
          </Link>
          <div className="mb-1 mt-2"><BookButton onOpen={onBook} /></div>
          <Destination {...leading[0]} />
          <Destination {...trailing[0]} />
          <Destination {...account} />
          <div className="mt-auto flex flex-col items-center gap-2">
            <LanguageMenu className="min-w-0 border border-on-ink-variant/40 px-2.5 text-on-ink [&>svg]:hidden" />
            {member.session && <SignOut csrfToken={member.session.csrfToken} onDone={member.clear} />}
          </div>
        </div>
      ) : (
        <div className="relative grid h-18 grid-cols-[1fr_1fr_5.5rem_1fr_1fr]">
          {leading.map(destination => <Destination key={destination.to} {...destination} />)}
          <BookButton onOpen={onBook} />
          <Destination {...trailing[0]} />
          <Destination {...account} />
        </div>
      )}
    </nav>
  )
}

// Keluar, at the very foot of the rail. On phones it lives in Akun.
function SignOut({ csrfToken, onDone }: { csrfToken: string; onDone: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  async function signOut() {
    setPending(true)
    try {
      await customerRequest('/api/customer/auth/sign-out', { body: {}, csrfToken })
      onDone()
      toast({ message: t(publicMessages.signedOut) })
      void navigate('/', { viewTransition: true })
    } catch {
      toast({ message: t(publicMessages.signOutFailed) })
    } finally { setPending(false) }
  }
  return (
    <button type="button" onClick={() => void signOut()} disabled={pending} aria-busy={pending}
      className="pressable flex min-h-16 w-full flex-col items-center justify-center gap-0.5 text-on-ink-variant transition-colors duration-200 hover:text-on-ink disabled:opacity-60">
      <LogOut aria-hidden="true" className="size-6" />
      <span className="text-label">{t(publicMessages.signOut)}</span>
    </button>
  )
}
