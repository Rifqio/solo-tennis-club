import { cn } from '@/lib/utils'
import { crestBall, crestLetters, crestSeams, crestShield, crestViewBox } from './crest-paths'

// The club crest: a shield lettered STC with a lime ball seated in a notch at the top. The shield takes currentColor;
// `detailClassName` colours the letters, so a white shield on the court-blue band gets blue letters and a blue shield
// on a light surface gets white ones. This is the small cut for UI sizes: the inner line and SOLO stay in the full logo
// (public/icons, brand/logo). `lettered={false}` leaves a plain shield for places that already print the name beside it.
// On light surfaces lime barely separates from the page, so `ballRim` rings the ball in the shield's colour.
export function ClubCrest({ className, detailClassName = 'fill-band', lettered = true, ballRim = false }: {
  className?: string; detailClassName?: string; lettered?: boolean; ballRim?: boolean
}) {
  return (
    <svg aria-hidden="true" viewBox={crestViewBox} className={cn('h-8 w-[1.6rem] shrink-0', className)}>
      <path fill="currentColor" d={crestShield} />
      {lettered && <path className={detailClassName} d={crestLetters} />}
      <circle cx={crestBall.cx} cy={crestBall.cy} r={crestBall.r} className="fill-accent" />
      {crestSeams.map(d => <path key={d} d={d} className="fill-white" />)}
      {ballRim && <circle cx={crestBall.cx} cy={crestBall.cy} r={crestBall.r - 3} fill="none" stroke="currentColor" strokeWidth="6" />}
    </svg>
  )
}

// The crest carries the club's letters, so the written name is for screen readers only.
export function Wordmark({ name, detailClassName, ballRim }: { name: string; detailClassName?: string; ballRim?: boolean }) {
  return (
    <span className="flex items-center">
      <ClubCrest className="h-10 w-8" detailClassName={detailClassName} ballRim={ballRim} />
      <span className="sr-only">{name}</span>
    </span>
  )
}
