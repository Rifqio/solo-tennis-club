import { m } from 'motion/react'
import { popSpring } from '@/lib/motion'

// Burst bits around the check badge: lime and white only, flying outward once.
const bits = [
  { x: -96, y: -58, r: -160, w: 10, h: 10, round: true, lime: true },
  { x: 92, y: -70, r: 140, w: 8, h: 14, round: false, lime: false },
  { x: -70, y: 62, r: 200, w: 8, h: 14, round: false, lime: false },
  { x: 104, y: 40, r: -120, w: 10, h: 10, round: true, lime: true },
  { x: -10, y: -104, r: 90, w: 6, h: 12, round: false, lime: false },
  { x: 30, y: 96, r: -90, w: 8, h: 8, round: true, lime: true },
]

// The booked moment, drawn from the club's own subject: a tennis court in white lines, a check badge that pops in
// and draws its tick, a small burst, and a lime ball that drops onto the court and bounces to rest. It plays once;
// with reduced motion, MotionConfig skips the movement and the finished picture shows at once.
export function BookedArt() {
  return (
    <div aria-hidden="true" className="relative h-60 w-full max-w-[24rem] shrink-0 self-center">
      <svg viewBox="0 0 390 300" preserveAspectRatio="none" className="absolute inset-0 size-full" fill="none" stroke="currentColor" strokeWidth="2.5">
        <g className="text-on-signboard/25">
          <path d="M40 300 L95 40 H295 L350 300" />
          <path d="M70 300 L112 40 M320 300 L278 40" />
          <path d="M86 150 H304 M195 150 V300" />
        </g>
        <path d="M95 40 H295" strokeWidth="4" className="text-on-signboard/50" />
      </svg>

      <div className="absolute left-1/2 top-12 size-28 -translate-x-1/2">
        {bits.map((bit, index) => (
          <m.span
            key={index}
            className={`absolute left-1/2 top-1/2 ${bit.lime ? 'bg-accent' : 'bg-on-signboard'} ${bit.round ? 'rounded-full' : 'rounded-[2px]'}`}
            style={{ width: bit.w, height: bit.h }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
            animate={{ x: bit.x, y: bit.y, rotate: bit.r, opacity: [0, 1, 0] }}
            transition={{ delay: 0.56, duration: 0.9, ease: [0.1, 0.7, 0.3, 1] }}
          />
        ))}
        <m.svg viewBox="0 0 112 112" className="absolute inset-0 size-full"
          initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...popSpring, delay: 0.12 }}>
          <circle cx="56" cy="56" r="52" className="fill-on-signboard" />
          <m.path d="M36 57 L50 71 L77 43" fill="none" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.52, duration: 0.38, ease: 'easeOut' }} />
        </m.svg>
      </div>

      <div className="absolute left-[64%] top-[11rem]">
        <m.span className="absolute left-0.5 top-[1.875rem] h-2 w-[1.875rem] rounded-full bg-ink"
          initial={{ x: -60, scale: 0.3, opacity: 0 }}
          animate={{ x: [-60, 0, 14, 24, 29, 32], scale: [0.3, 1, 0.7, 1, 0.85, 1], opacity: [0, 0.35, 0.2, 0.35, 0.28, 0.35] }}
          transition={{ delay: 0.2, duration: 1.1, times: [0, 0.45, 0.62, 0.78, 0.88, 1] }} />
        <m.svg viewBox="0 0 34 34" className="absolute left-0 top-0 size-[2.125rem]"
          initial={{ x: -60, y: -160 }}
          animate={{ x: [-60, 0, 14, 24, 29, 32], y: [-160, 0, -46, 0, -12, 0] }}
          transition={{ delay: 0.2, duration: 1.1, times: [0, 0.45, 0.62, 0.78, 0.88, 1], ease: 'easeInOut' }}>
          <circle cx="17" cy="17" r="16" className="fill-accent" />
          <path d="M6.5 6.5c6 6 6 15 0 21M27.5 6.5c-6 6-6 15 0 21" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-on-signboard" />
        </m.svg>
      </div>
    </div>
  )
}
