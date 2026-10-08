import type { Transition } from 'motion/react'

// One motion vocabulary for the app. Springs settle without visible overshoot, can be interrupted mid-flight,
// and pick up the velocity of whatever they replace, so a quick second tap never waits for the first animation.
export const selectionSpring: Transition = { type: 'spring', stiffness: 520, damping: 40, mass: 0.7 }
export const contentSpring: Transition = { type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }
export const popSpring: Transition = { type: 'spring', stiffness: 600, damping: 32 }

// Shared-axis X: content enters from the side the visitor is travelling toward, by a short distance.
export const SHARED_AXIS_OFFSET = 28
