import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// The six state illustrations (G3; prompts in .planning/STATE-ART-PROMPTS.md). Each says one thing, so a screen picks
// the one that matches its meaning and never draws its own:
// - no-bookings: a racket and ball waiting on court. Nothing booked yet; the court is ready.
// - no-sessions: an empty court from above. No play on this day.
// - empty-history: a courtside bench. Nothing played or recorded yet.
// - all-clear: the ball on the line, in. Good news: nothing to check.
// - load-error: the ball caught in the net. It did not get through; try again.
// - offline: the court at night, lights off. The connection dropped.
export type StateScene = 'no-bookings' | 'no-sessions' | 'empty-history' | 'all-clear' | 'load-error' | 'offline'

interface EmptyStateProps {
  scene: StateScene
  // The fact, as a plain sentence. Never "Tidak ada data".
  title: string
  // One sentence: what will appear here, or why it is empty. Never repeats the title.
  body?: ReactNode
  // At most one action, the verb that fills this screen. Good-news empties take none.
  action?: ReactNode
  // Inside a filtered view the picture is already known, so it does not settle in again on every switch.
  still?: boolean
  // A smaller picture for side panels and sheets, so the words stay in view beside other content.
  compact?: boolean
  // Experiment (Booking kamu only for now): the picture fills the column and the words sit on a card laid over it.
  poster?: boolean
  className?: string
}

// The offline picture is needed exactly when nothing can be downloaded, so it is fetched ahead, once the page is idle.
if (typeof window !== 'undefined') {
  const fetchAhead = () => { for (const size of [640, 1200]) new Image().src = `/art/states/offline-${size}.webp` }
  if ('requestIdleCallback' in window) window.requestIdleCallback(fetchAhead, { timeout: 4000 })
  else setTimeout(fetchAhead, 2000)
}

// An empty, failed or offline screen (G3): the picture, the fact, one sentence, one action. Stacked and centred in a
// narrow column or on a phone; from 40rem of its own width it becomes a white card with the picture on the left, so
// side panels stay stacked while full desktop columns go wide. Failures are announced at once, empties politely.
export function EmptyState({ scene, title, body, action, still, compact, poster, className }: EmptyStateProps) {
  const urgent = scene === 'load-error' || scene === 'offline'
  if (poster) return <PosterState {...{ scene, title, body, action, still, urgent, className }} />
  return (
    <div className={cn('@container', className)}>
      <div {...(urgent ? { role: 'alert' } : { role: 'status', 'aria-live': 'polite' as const })}
        className="flex flex-col items-center gap-4 py-2 text-center @[40rem]:grid @[40rem]:grid-cols-[minmax(0,18.75rem)_minmax(0,1fr)] @[40rem]:items-center @[40rem]:gap-7 @[40rem]:rounded-lg @[40rem]:bg-surface-container-lowest @[40rem]:p-4 @[40rem]:text-left">
        <StateArt scene={scene} still={still} compact={compact} />
        <div className="flex max-w-[22rem] flex-col items-center gap-4 @[40rem]:max-w-none @[40rem]:items-start @[40rem]:pr-4">
          <div className="flex flex-col gap-1">
            <p className="text-title font-bold text-balance text-on-surface @[40rem]:text-headline">{title}</p>
            {body && <div className="text-pretty text-on-surface-variant">{body}</div>}
          </div>
          {action}
        </div>
      </div>
    </div>
  )
}

// Per picture: where its subject sits top to bottom, so the 2:1 and 5:2 crops keep it in view, and where the card
// rests on a wide column. Most subjects sit left with open court on the right; the bench fills the middle, so its card
// rests top left, over court lines only.
const poster: Record<StateScene, { focus: string; card: string }> = {
  'no-bookings': { focus: 'object-[center_78%]', card: '@[56rem]:right-0 @[56rem]:mr-[4%] @[56rem]:inset-y-0 @[56rem]:my-auto' },
  'no-sessions': { focus: 'object-[center_50%]', card: '@[56rem]:right-0 @[56rem]:mr-[4%] @[56rem]:inset-y-0 @[56rem]:my-auto' },
  'empty-history': { focus: 'object-[center_45%]', card: '@[56rem]:left-0 @[56rem]:ml-[4%] @[56rem]:top-[7%] @[56rem]:w-[min(23rem,36%)]' },
  'all-clear': { focus: 'object-[center_45%]', card: '@[56rem]:right-0 @[56rem]:mr-[4%] @[56rem]:inset-y-0 @[56rem]:my-auto' },
  'load-error': { focus: 'object-[center_55%]', card: '@[56rem]:right-0 @[56rem]:mr-[4%] @[56rem]:inset-y-0 @[56rem]:my-auto' },
  offline: { focus: 'object-[center_60%]', card: '@[56rem]:right-0 @[56rem]:mr-[4%] @[56rem]:inset-y-0 @[56rem]:my-auto' },
}

// Two layers: the court fills the whole column, and a white card carries the words over it, from 56rem of column
// width (narrower, the card would cover the subject). Every state picture was
// drawn with its subject on the left and open court on the right, so on a wide column the card sits in that open court
// and covers nothing that matters (the table below says where, per picture); the picture is cropped to 2:1 (5:2 from 72rem) around its subject. On a
// phone the picture keeps 4:3 and the card overlaps its lower edge. The card is solid white because white text straight
// on court blue is too faint for a sentence.
function PosterState({ scene, title, body, action, still, urgent, className }: Omit<EmptyStateProps, 'compact' | 'poster'> & { urgent: boolean }) {
  const base = `/art/states/${scene}`
  return (
    <div className={cn('@container', className)}>
      <div {...(urgent ? { role: 'alert' } : { role: 'status', 'aria-live': 'polite' as const })} className="relative isolate flex flex-col">
        <div aria-hidden="true" className={cn('aspect-[4/3] w-full overflow-hidden rounded-lg bg-band-deep @[56rem]:aspect-[2/1] @[72rem]:aspect-[5/2]', !still && 'state-art-in')}>
          <img src={`${base}-640.webp`} srcSet={`${base}-640.webp 640w, ${base}-1200.webp 1200w`}
            sizes="(min-width: 64rem) 78rem, 100vw" width={1200} height={896} alt="" decoding="async"
            onError={event => { event.currentTarget.style.visibility = 'hidden' }}
            className={cn('size-full object-cover', poster[scene].focus)} />
        </div>
        <div className={cn('relative mx-3 -mt-14 flex flex-col items-start gap-4 rounded-lg bg-surface-container-lowest p-5',
          '@[56rem]:absolute @[56rem]:m-0 @[56rem]:h-fit @[56rem]:w-[min(26rem,44%)] @[56rem]:p-7', poster[scene].card)}>
          <div className="flex flex-col gap-1.5">
            <p className="text-title font-bold text-balance text-on-surface @[56rem]:text-headline">{title}</p>
            {body && <div className="text-pretty text-on-surface-variant">{body}</div>}
          </div>
          {action}
        </div>
      </div>
    </div>
  )
}

// The picture keeps its 4:3 frame before it loads (Deep Court behind it), so nothing below it moves. It is decoration:
// the title and sentence carry the meaning. On phones it settles in once; on desktop it simply appears.
function StateArt({ scene, still, compact }: { scene: StateScene; still?: boolean; compact?: boolean }) {
  const base = `/art/states/${scene}`
  return (
    <div aria-hidden="true" className={cn('aspect-[4/3] w-full overflow-hidden rounded-lg bg-band-deep @[40rem]:max-w-none', compact ? 'max-w-[15rem]' : 'max-w-[22rem]', !still && 'state-art-in')}>
      {/* If the picture cannot load, the Deep Court frame stays rather than a broken-image mark. */}
      <img src={`${base}-640.webp`} srcSet={`${base}-640.webp 640w, ${base}-1200.webp 1200w`}
        sizes={compact ? '15rem' : '(min-width: 64rem) 300px, min(calc(100vw - 2rem), 22rem)'} width={1200} height={896} alt="" decoding="async"
        onError={event => { event.currentTarget.style.visibility = 'hidden' }}
        className="size-full object-cover" />
    </div>
  )
}
