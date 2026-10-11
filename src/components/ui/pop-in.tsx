import type { ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { popSpring } from '@/lib/motion'

// Something the person's own pick reveals (a check, a radio dot): it pops in on the pop spring when the pick happens,
// and is simply there when a screen opens with it already picked (DESIGN.md, Motion: animate what changes).
export function PopIn({ show, className, children }: { show: boolean; className?: string; children?: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && <m.span key="pop" aria-hidden="true" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.1 } }} transition={popSpring} className={className}>{children}</m.span>}
    </AnimatePresence>
  )
}
