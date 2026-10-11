import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CourtScene, type CourtSceneKind } from '@/components/brand/court-scene'
import { cn } from '@/lib/utils'

interface ResultScreenProps {
  kind: CourtSceneKind
  back: { to: string; label: string }
  // The session in one or two short lines (class, then date · time · places).
  session: ReactNode
  heading: string
  message: ReactNode
  // One fact on a deep tile under the message (the deadline, places left, the money that is safe).
  pill?: ReactNode
  // Small text above the actions.
  hint?: string
  actions: ReactNode
  // Pages with the dock end the tray above it; focused tasks (the pay screen) fill the screen.
  aboveDock?: boolean
}

// A phone feedback screen (boards 9g-9j, G2): the court full-bleed on Deep Court plays the outcome once, the call in
// words under it, the way on in a white tray. Text and buttons are there from the first frame; nothing waits.
export function ResultScreen({ kind, back, session, heading, message, pill, hint, actions, aboveDock = false }: ResultScreenProps) {
  return (
    // Above the dock, the screen runs under it (cancelling the layout's dock padding) so the white tray meets the dock.
    <div className={cn('flex min-h-dvh flex-col bg-band-tile text-on-signboard [&_:focus-visible]:outline-white',
      aboveDock && '-mb-[calc(7rem+env(safe-area-inset-bottom))]')}>
      <div className="flex items-center gap-3 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <Link to={back.to} viewTransition data-nav="pop" aria-label={back.label}
          className="pressable flex size-12 shrink-0 items-center justify-center rounded-full bg-band-deep"><ChevronLeft aria-hidden="true" className="size-6" /></Link>
        <div className="min-w-0 text-label leading-snug">{session}</div>
      </div>
      <div className="mt-1"><CourtScene kind={kind} /></div>
      <div className="flex flex-col items-center gap-2 px-6 pt-1 text-center">
        <h1 className="text-headline font-bold leading-tight">{heading}</h1>
        <p className="text-title font-normal leading-snug">{message}</p>
        {pill && <p className="mt-1.5 rounded-full bg-band-deep px-3.5 py-1.5 text-label">{pill}</p>}
      </div>
      <div className={cn('mt-auto flex flex-col gap-2 rounded-t-lg bg-surface-container-lowest px-4 pt-3.5 text-on-surface [&_:focus-visible]:outline-primary',
        aboveDock ? 'pb-[calc(8rem+env(safe-area-inset-bottom))]' : 'pb-[max(1.75rem,env(safe-area-inset-bottom))]')}>
        {hint && <p className="text-center text-label text-on-surface-variant">{hint}</p>}
        {actions}
      </div>
    </div>
  )
}
