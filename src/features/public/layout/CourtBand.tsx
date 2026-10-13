import type { ReactNode, Ref } from 'react'
import { CourtLines } from '@/components/brand/court-lines'
import { Wordmark } from '@/components/brand/club-crest'
import { LanguageMenu } from '@/components/ui/language-switch'
import { cn } from '@/lib/utils'
import { clubContent } from '../club/club-content'
import { ConnectionBanner } from '@/components/ui/connection-banner'

interface CourtBandProps {
  // The screen headline in white. Task screens (sign-in, booking) omit it and keep their own heading below.
  title?: string
  headingRef?: Ref<HTMLHeadingElement>
  // Sits at the end of the headline row (the schedule's Today chip, the desktop booking tabs).
  action?: ReactNode
  children?: ReactNode
  className?: string
}

// The court-blue band at the top of each screen: wordmark and language action, the screen headline, then whatever
// the screen keeps on blue (the schedule's month and date tiles). Only large white text sits directly on Court Blue;
// small text goes on Deep Court tiles. Focus turns white here because the blue outline would vanish.
export function CourtBand({ title, headingRef, action, children, className }: CourtBandProps) {
  return <>
    <header className={cn(
      'relative isolate overflow-hidden rounded-b-lg bg-band pt-[env(safe-area-inset-top)] text-on-signboard [view-transition-name:app-bar] [&_:focus-visible]:outline-white',
      // Desktop: an inset card in the shared column (desk-column), aligned with the content below it.
      'desk-column lg:mt-5 lg:rounded-lg lg:pt-1',
      className,
    )}>
      <CourtLines className="pointer-events-none absolute -right-12 -top-4 -z-10 h-64 text-on-signboard/15 sm:right-8" />
      <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col sm:pt-5 lg:max-w-none lg:px-8">
        {/* From 640px the rail carries the club mark and the language action, so this row is phones only. */}
        <div className="flex h-14 items-center justify-between gap-3 sm:hidden">
          {/* Text identity until the club supplies a logo (R-23); no image is invented. */}
          <p aria-label={clubContent.name}><Wordmark name={clubContent.shortName} /></p>
          <LanguageMenu className="-mr-3" />
        </div>
        {title && (
          <div className="flex min-h-12 items-center justify-between gap-3 pb-3">
            <h1 ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="text-headline font-bold lg:text-display">{title}</h1>
            {action}
          </div>
        )}
        {children}
        {!title && !children && <div className="h-2" />}
      </div>
    </header>
    {/* Under the band: a lasting state such as being offline (G1 banner). */}
    <ConnectionBanner voice="member" className="page-gutter mx-auto w-full max-w-[50rem] lg:max-w-none desk-column" />
  </>
}
