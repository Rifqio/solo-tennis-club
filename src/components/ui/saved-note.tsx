import type { ReactNode } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { popSpring } from '@/lib/motion'

// Confirms the person's own action (a save, a booking recorded, a sign-in): it rises into place once, on the pop
// spring, when it appears. Errors and information stay still; only confirmations move (DESIGN.md, Motion).
// `as="span"` inside phrasing content (a line of text in a span).
export function SavedNote({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'span' }) {
  const reduceMotion = useReducedMotion()
  const Element = as === 'span' ? m.span : m.div
  return (
    <Element initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={popSpring} className={className}>
      {children}
    </Element>
  )
}
