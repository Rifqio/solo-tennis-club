import { ChevronLeft, ChevronRight } from 'lucide-react'
import { animate, AnimatePresence, m, useMotionValue, useReducedMotion } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Wordmark } from '@/components/brand/ball-mark'
import { useI18n } from '@/i18n/use-i18n'
import { selectionHaptic } from '@/lib/haptics'
import { contentSpring, popSpring, selectionSpring, SHARED_AXIS_OFFSET } from '@/lib/motion'
import { clubContent } from '../club/club-content'
import { onboardingMessages } from './onboarding.messages'

// Generic licensed tennis photography (see public/photos/*.json); replace with club photos when supplied.
const photos = ['/photos/court-net.webp', '/photos/three-balls.webp', '/photos/ball-baseline.webp']
const LAST = photos.length - 1

// The padel start bar: a lime handle over an ink track. Tap it, or drag it to the end, to finish.
// Released early, it springs back. Keyboard users press it like any button.
function StartBar({ onFinish }: { onFinish: () => void }) {
  const { t } = useI18n()
  const trackRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [travel, setTravel] = useState(0)
  const dragged = useRef(false)
  // animate() runs outside MotionConfig, so reduced motion is honoured here by hand: the handle jumps instead.
  const snap = useReducedMotion() ? { duration: 0 } : popSpring

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => setTravel(track.clientWidth / 3)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [])

  const handleDragEnd = () => {
    if (x.get() >= travel * 0.8) { void animate(x, travel, snap); onFinish() }
    else void animate(x, 0, snap)
    // The click that follows a drag must not count as a tap.
    window.setTimeout(() => { dragged.current = false }, 0)
  }

  return (
    <div ref={trackRef} className="relative h-16 w-full rounded-xs bg-ink-raised">
      <m.button
        type="button"
        drag="x"
        dragConstraints={{ left: 0, right: travel }}
        dragElastic={0.04}
        dragMomentum={false}
        style={{ x }}
        onDragStart={() => { dragged.current = true }}
        onDragEnd={handleDragEnd}
        onClick={() => { if (!dragged.current) onFinish() }}
        aria-label={t(onboardingMessages.startHint)}
        className="absolute inset-y-0 left-0 flex w-2/3 touch-pan-y items-center justify-between rounded-xs bg-accent px-5 text-on-accent"
      >
        <span className="text-title font-semibold">{t(onboardingMessages.start)}</span>
        <span aria-hidden="true" className="flex -space-x-3">
          <ChevronRight className="size-6" strokeWidth={2.5} />
          <ChevronRight className="size-6 opacity-60" strokeWidth={2.5} />
          <ChevronRight className="size-6 opacity-30" strokeWidth={2.5} />
        </span>
      </m.button>
    </div>
  )
}

// After the tennis reference: a raised-ink capsule (plain ink would vanish on the scrim) with a previous circle, the dots, and a lime next circle.
function Pager({ index, onStep }: { index: number; onStep: (next: number) => void }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-4 self-start rounded-full bg-ink-raised p-1.5">
      <button
        type="button"
        onClick={() => onStep(index - 1)}
        disabled={index === 0}
        aria-label={t(onboardingMessages.previous)}
        className="state-layer pressable flex size-12 items-center justify-center rounded-full bg-ink text-on-ink transition-opacity duration-200 disabled:opacity-40"
      >
        <ChevronLeft aria-hidden="true" className="size-6" />
      </button>
      <span aria-hidden="true" className="flex items-center gap-2">
        {photos.map((photo, dot) => (
          <span key={photo} className="relative flex h-2 w-2 items-center justify-center">
            <span className="size-2 rounded-full bg-on-ink-variant" />
            {dot === index && <m.span layoutId="onboarding-dot" transition={selectionSpring} className="absolute inset-0 rounded-full bg-white" />}
          </span>
        ))}
      </span>
      <button
        type="button"
        onClick={() => onStep(index + 1)}
        aria-label={t(onboardingMessages.next)}
        className="state-layer pressable flex size-12 items-center justify-center rounded-full bg-accent text-on-accent"
      >
        <ChevronRight aria-hidden="true" className="size-6" strokeWidth={2.5} />
      </button>
    </div>
  )
}

// First visit only: three full-bleed court photographs with an ink scrim for the text, a pager, and the start bar on
// the last slide. "Lewati" sits top right on every slide. Finishing or skipping lands on today's schedule.
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const slide = onboardingMessages.slides[index]

  const step = (next: number) => {
    if (next < 0 || next > LAST || next === index) return
    setDirection(next > index ? 1 : -1)
    setIndex(next)
    selectionHaptic()
  }

  // Each new slide moves focus to its headline, so screen readers announce it and the page behind stays out of reach.
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [index])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onDone() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey) }
  }, [onDone])

  const handleSwipe = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const travelled = Math.abs(info.offset.x) > 72 || (Math.abs(info.velocity.x) > 500 && Math.abs(info.offset.x) > 24)
    if (travelled) step(index + (info.offset.x < 0 ? 1 : -1))
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={t(onboardingMessages.label)} className="fixed inset-0 z-50 overflow-hidden bg-ink text-on-ink [&_:focus-visible]:outline-accent">
      <AnimatePresence initial={false}>
        <m.img
          key={photos[index]}
          src={photos[index]}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // The photo crossfades with the slide; with reduced motion it simply changes.
          transition={reduceMotion ? { duration: 0 } : contentSpring}
          className="absolute inset-0 size-full object-cover"
        />
      </AnimatePresence>
      {/* Preload the other photos so a slide change never waits on the network. */}
      <div aria-hidden="true" className="hidden">{photos.map(photo => <img key={photo} src={photo} alt="" />)}</div>
      <div aria-hidden="true" className="photo-scrim absolute inset-0" />

      <div className="absolute right-0 top-0 pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onDone} className="pressable inline-flex min-h-12 items-center">
          <span className="state-layer rounded-full bg-band-tile px-4 py-2 text-label font-semibold text-on-signboard">{t(onboardingMessages.skip)}</span>
        </button>
      </div>

      <m.div
        drag={index < LAST ? 'x' : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        dragSnapToOrigin
        onDragEnd={handleSwipe}
        className="absolute inset-x-0 bottom-0 flex justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24"
      >
        <div className="page-gutter flex w-full max-w-[32rem] flex-col gap-6">
          <Wordmark name={clubContent.shortName} />
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <m.div
              key={index}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ opacity: 0, x: dir * SHARED_AXIS_OFFSET }),
                center: { opacity: 1, x: 0 },
                exit: (dir: number) => ({ opacity: 0, x: dir * -SHARED_AXIS_OFFSET, transition: { duration: 0.09 } }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={contentSpring}
              className="flex min-h-[11rem] flex-col justify-end gap-3"
            >
              <h2 ref={headingRef} tabIndex={-1} className="text-display font-bold text-white outline-none">{t(slide.title)}</h2>
              <p className="text-body text-on-ink">{t(slide.body)}</p>
            </m.div>
          </AnimatePresence>
          <p className="sr-only" aria-live="polite">{t(onboardingMessages.progress, { current: index + 1, total: photos.length })}</p>
          <div className="flex min-h-16 items-center">
            {index < LAST ? <Pager index={index} onStep={step} /> : <StartBar onFinish={onDone} />}
          </div>
        </div>
      </m.div>
    </div>
  )
}
