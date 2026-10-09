import { cn } from '@/lib/utils'

export type ScoreboardTone = 'live' | 'ended' | 'cancelled'

const toneClasses: Record<ScoreboardTone, string> = {
  live: 'bg-ink text-accent',
  ended: 'bg-surface-container-high text-on-surface-variant',
  cancelled: 'border border-dashed border-outline text-on-surface-variant',
}

// The signature: a start time shown as two scoreboard cells, hour and minute, in lime digits on ink.
// The cells are decoration for sighted readers; assistive technology reads the plain time once.
export function Scoreboard({ time, tone = 'live', size = 'md', className }: { time: string; tone?: ScoreboardTone; size?: 'sm' | 'md'; className?: string }) {
  const [hour = '--', minute = '--'] = time.split(':')
  const cell = cn('flex items-center justify-center rounded-xs font-bold tabular-nums', size === 'md' ? 'size-12 text-numeral' : 'size-9 text-title', toneClasses[tone])
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-0.5', className)}>
      <span className="sr-only">{time}</span>
      <span aria-hidden="true" className={cell}>{hour}</span>
      <span aria-hidden="true" className={cn('font-bold', size === 'md' ? 'text-title' : 'text-body', tone === 'live' ? 'text-on-surface' : 'text-on-surface-variant')}>:</span>
      <span aria-hidden="true" className={cell}>{minute}</span>
    </span>
  )
}
