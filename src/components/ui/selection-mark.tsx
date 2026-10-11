import { m } from 'motion/react'
import { selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'

// The shared marker behind the chosen item of a switch, filter or single-choice list (DESIGN.md, Motion): when the
// choice changes, the content swaps at once and only this marker slides to the new item on the selection spring.
//
// Paint order matters while it travels. Put `isolate` on the group and `selection-item` on each item (relative, but
// not its own stacking context), and draw each item's resting look with SelectionBase rather than a background on the
// item. Then every base sits under the marker and every label sits over it, wherever the marker is mid-flight.
export function SelectionMark({ layoutId, className }: { layoutId: string; className?: string }) {
  return <m.span layoutId={layoutId} transition={selectionSpring} aria-hidden="true" className={cn('pointer-events-none absolute inset-0 -z-10', className)} />
}

// An item's resting background and border, drawn under any travelling SelectionMark.
export function SelectionBase({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0 -z-20', className)} />
}
