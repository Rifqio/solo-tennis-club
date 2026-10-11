import { useState } from 'react'
import { contentSpring, SHARED_AXIS_OFFSET } from './motion'

// Which way a guided flow just moved: 1 forward, -1 back, 0 before its first move. `position` is the step's place in
// the flow, or null while the flow is still loading, so the first step and a step reached from loading simply appear.
export function useStepDirection(position: number | null) {
  const [seen, setSeen] = useState({ position, direction: 0 })
  if (seen.position !== position) {
    setSeen({ position, direction: seen.position === null || position === null ? 0 : position > seen.position ? 1 : -1 })
  }
  return seen.position === position ? seen.direction : 0
}

// A step of a guided flow (session editor, Catat booking, booking, sign-in) entering: shared axis X on the content
// spring, from the right going forward and from the left going back. Spread on the step's root, keyed by the step.
export function stepEnter(direction: number, reduceMotion: boolean | null) {
  return {
    initial: reduceMotion || direction === 0 ? false : { opacity: 0, x: direction * SHARED_AXIS_OFFSET },
    animate: { opacity: 1, x: 0 },
    transition: contentSpring,
  } as const
}
