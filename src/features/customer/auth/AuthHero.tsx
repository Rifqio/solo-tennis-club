import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Wordmark } from '@/components/brand/ball-mark'
import { LanguageMenu } from '@/components/ui/language-switch'
import { cn } from '@/lib/utils'
import { clubContent } from '@/features/public/club/club-content'

// Generic licensed tennis photography (public/photos/three-balls.webp.json); replace with club photos when supplied.
const PHOTO = '/photos/three-balls.webp'

// The sign-in header, after the reference login screens: a photo across the top with the back action, the wordmark
// and the language action over an ink scrim strip. Shorter once the visitor is past the first step (at once: the form
// below is what moves). Named app-bar so it holds still while the page under it pushes or pops.
export function AuthHero({ backTo, backLabel, compact = false }: { backTo: string; backLabel: string; compact?: boolean }) {
  return (
    <div className={cn('relative isolate shrink-0 overflow-hidden rounded-b-lg bg-ink [view-transition-name:app-bar]', compact ? 'h-44' : 'h-[min(34dvh,17.5rem)]')}>
      <img src={PHOTO} alt="" decoding="async" fetchPriority="high" className="absolute inset-0 -z-10 size-full object-cover object-[center_40%]" />
      <div aria-hidden="true" className="photo-scrim-top absolute inset-x-0 top-0 -z-10 h-32" />
      <div className="page-gutter mx-auto flex w-full max-w-lg items-center justify-between gap-3 pt-[max(1rem,env(safe-area-inset-top))] text-on-signboard [&_:focus-visible]:outline-white">
        <Link to={backTo} viewTransition data-nav="pop" aria-label={backLabel} className="state-layer pressable flex size-12 shrink-0 items-center justify-center rounded-full bg-band-tile">
          <ChevronLeft aria-hidden="true" className="size-6" />
        </Link>
        <p aria-label={clubContent.name}><Wordmark name={clubContent.shortName} /></p>
        <LanguageMenu className="bg-band-tile" />
      </div>
    </div>
  )
}
