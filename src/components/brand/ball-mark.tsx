import { cn } from '@/lib/utils'

// The club mark until the club supplies a logo: a tennis ball, white with Deep Court seams so it reads on the blue band.
// `seamClassName` recolours the seams when the ball itself is blue (the desktop home page's top bar).
export function BallMark({ className, seamClassName = 'stroke-band-tile' }: { className?: string; seamClassName?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn('size-6 shrink-0', className)}>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M4.6 4.2c4.2 4.2 4.2 11.4 0 15.6M19.4 4.2c-4.2 4.2-4.2 11.4 0 15.6" fill="none" className={seamClassName} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function Wordmark({ name, seamClassName }: { name: string; seamClassName?: string }) {
  return (
    <span className="flex items-center gap-2">
      <BallMark seamClassName={seamClassName} />
      <span className="text-body font-bold uppercase leading-none tracking-[0.16em]">{name}</span>
    </span>
  )
}
