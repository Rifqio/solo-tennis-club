import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BookSheet } from './BookSheet'
import { Dock } from './Dock'

// Each screen draws its own court band (CourtBand), since what sits on the blue differs per screen.
// The dock is shared: bottom bar with the notched book button on phones, left rail from 640px.
export function PublicLayout() {
  const [bookOpen, setBookOpen] = useState(false)
  return (
    <div className="min-h-dvh bg-surface">
      {/* Horizontal motion (day slides, swipe) must never widen the page: on phones a wider page makes the browser
          zoom out, which resizes the viewport and moves the fixed dock. clip, unlike hidden, adds no scroll container.
          Bottom padding reserves the dock, the book button's rise above it, and the safe area. */}
      <main className="overflow-x-clip pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-8 sm:pl-20">
        <Outlet />
      </main>
      <Dock onBook={() => setBookOpen(true)} />
      <BookSheet open={bookOpen} onClose={() => setBookOpen(false)} />
    </div>
  )
}
