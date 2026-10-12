import type { ReactElement } from 'react'
import { cn } from '@/lib/utils'
import { SlowNotice } from './slow-notice'

export type SkeletonShape = 'session-card' | 'booking-card' | 'table-row' | 'list-row' | 'roster-row' | 'card' | 'detail'

interface SkeletonProps {
  shape: SkeletonShape
  count?: number
  // Read once by screen readers ("Memuat booking..."); the shapes themselves are hidden from them.
  label?: string
  // Offered by the slow notice after five seconds.
  onRetry?: () => void
  voice?: 'member' | 'admin'
  className?: string
}

// Loading (G3): placeholders shaped like the content on its way, so nothing jumps when it lands. Nothing shows for the
// first 300ms, so a fast load never flickers; then the shapes fade in and one soft sweep runs over them until the data
// arrives (the only repeating motion in the app; reduced motion keeps the shapes still). After five seconds a quiet
// line says the connection is slow.
export function Skeleton({ shape, count = 2, label, onRetry, voice, className }: SkeletonProps) {
  const Shape = shapes[shape]
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {label && <p role="status" className="sr-only">{label}</p>}
      <div aria-hidden="true" className={cn('skeleton-in flex flex-col', shape === 'roster-row' || shape === 'table-row' ? '' : 'gap-3')}>
        {Array.from({ length: count }, (_, index) => <Shape key={index} />)}
      </div>
      <SlowNotice onRetry={onRetry} voice={voice} />
    </div>
  )
}

function Bone({ className }: { className?: string }) {
  return <span className={cn('skeleton block h-3.5 rounded-xs', className)} />
}

const shapes: Record<SkeletonShape, () => ReactElement> = {
  // A scoreboard session card: the two time cells, the class, two detail lines and the places bar.
  'session-card': () => (
    <div className="flex flex-col gap-3 rounded-sm bg-surface-container-lowest p-4">
      <div className="flex gap-0.5"><Bone className="size-12" /><Bone className="ml-2 size-12" /></div>
      <Bone className="h-5 w-3/4" />
      <Bone className="w-1/2" />
      <Bone className="h-2 w-full rounded-full" />
    </div>
  ),
  // A booking card: the date tile, three lines and the status chip.
  'booking-card': () => (
    <div className="flex items-center gap-3 rounded-sm bg-surface-container-lowest p-4">
      <Bone className="h-14 w-12 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col gap-2"><Bone className="w-3/5" /><Bone className="h-3 w-2/5" /><Bone className="h-3 w-1/2" /></span>
      <Bone className="h-6 w-16 shrink-0 rounded-full" />
    </div>
  ),
  // A table row on a desktop list: a name, two columns and a chip.
  'table-row': () => (
    <div className="flex h-14 items-center gap-6 border-b border-outline-variant px-2">
      <Bone className="w-1/4" /><Bone className="h-3 w-1/5" /><Bone className="h-3 w-1/6" /><Bone className="ml-auto h-6 w-20 rounded-full" />
    </div>
  ),
  // A plain list row: a name and a subline.
  'list-row': () => (
    <div className="flex min-h-16 flex-col justify-center gap-2 rounded-sm bg-surface-container-lowest px-4 py-3">
      <Bone className="w-2/5" /><Bone className="h-3 w-3/5" />
    </div>
  ),
  // A roster row: the initial circle, the name and the payment chip.
  'roster-row': () => (
    <div className="flex items-center gap-3 border-b border-outline-variant py-3">
      <Bone className="size-7 shrink-0 rounded-full" /><Bone className="flex-1 basis-0" /><Bone className="h-5 w-14 shrink-0 rounded-full" />
    </div>
  ),
  // A card with a heading and a few lines (classes, account sections, recap tiles).
  card: () => (
    <div className="flex flex-col gap-3 rounded-sm bg-surface-container-lowest p-4">
      <Bone className="h-5 w-1/2" /><Bone className="h-3 w-4/5" /><Bone className="h-3 w-2/3" />
    </div>
  ),
  // One record opening: its heading, a summary block and the lines under it.
  detail: () => (
    <div className="flex flex-col gap-4">
      <Bone className="h-6 w-2/3" />
      <Bone className="h-24 w-full rounded-sm" />
      <span className="flex flex-col gap-2"><Bone className="w-4/5" /><Bone className="w-3/5" /><Bone className="w-2/3" /></span>
    </div>
  ),
}
