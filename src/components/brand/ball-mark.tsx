import { cn } from '@/lib/utils'

// The club mark until Lafu supplies a logo: a tennis ball, white with Deep Court seams so it reads on the blue band.
export function BallMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn('size-6 shrink-0', className)}>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M4.6 4.2c4.2 4.2 4.2 11.4 0 15.6M19.4 4.2c-4.2 4.2-4.2 11.4 0 15.6" fill="none" className="stroke-band-tile" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export function Wordmark({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2">
      <BallMark />
      <span className="text-body font-bold uppercase leading-none tracking-[0.16em]">{name}</span>
    </span>
  )
}
