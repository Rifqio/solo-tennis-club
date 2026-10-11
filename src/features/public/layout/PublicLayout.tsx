import { lazy, Suspense, useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useMediaQuery } from '@/lib/use-media-query'
import { markOnboarded, shouldShowOnboarding } from '../onboarding/onboarding-state'
import { BookSheet } from './BookSheet'
import { Dock } from './Dock'
import { ToastProvider } from '@/components/ui/toast'

// Loaded only on a first visit; returning visitors never download it.
const Onboarding = lazy(() => import('../onboarding/Onboarding'))

// Each screen draws its own court band (CourtBand), since what sits on the blue differs per screen.
// The dock is shared: bottom bar with the notched book button on phones, left rail from 640px.
export function PublicLayout() {
  const location = useLocation()
  const [bookOpen, setBookOpen] = useState(false)
  // Decided once, from the address the visit started on.
  const [onboarding, setOnboarding] = useState(() => shouldShowOnboarding(location.pathname, location.search))
  // Booking, paying, and signing in on the way to something (returnTo), are focused tasks: their own pinned action bar
  // takes the bottom of the screen, so the dock steps aside until the task is done (P2-11).
  const focusedTask = location.pathname.startsWith('/book/') || /^\/bookings\/[^/]+\/pay$/.test(location.pathname)
    || (location.pathname === '/customer/sign-in' && new URLSearchParams(location.search).has('returnTo'))
  // The desktop home page is the club's front page: it carries its own top nav instead of the app rail.
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const frontPage = isDesktop && location.pathname === '/'
  const bare = focusedTask || frontPage
  const finishOnboarding = useCallback(() => {
    markOnboarded()
    setOnboarding(false)
    window.scrollTo(0, 0)
    requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true }))
  }, [])

  return (
    <ToastProvider inset={bare ? undefined : 'sm:left-20'}>
    <div className="min-h-dvh bg-surface">
      {/* While onboarding covers the screen, the app behind it is inert: no focus, no screen reader access. */}
      <div inert={onboarding}>
        {/* Horizontal motion (day slides, swipe) must never widen the page: on phones a wider page makes the browser
            zoom out, which resizes the viewport and moves the fixed dock. clip, unlike hidden, adds no scroll container.
            Bottom padding reserves the dock, the book button's rise above it, and the safe area. */}
        <main className={bare ? 'overflow-x-clip' : 'overflow-x-clip pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-8 sm:pl-20'}>
          <Outlet />
        </main>
        {!bare && <Dock onBook={() => setBookOpen(true)} />}
      </div>
      <BookSheet open={bookOpen} onClose={() => setBookOpen(false)} />
      {onboarding && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-ink" />}>
          <Onboarding onDone={finishOnboarding} />
        </Suspense>
      )}
    </div>
    </ToastProvider>
  )
}
