import { cn } from '@/lib/utils'
import { coachInitials } from './coach-initials'

// A coach's portrait as a small round avatar in lists; initials when there is no photo.
export function CoachAvatar({ name, photoUrl, className }: { name: string; photoUrl: string | null; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-label font-bold text-primary', className)}>
      {photoUrl ? <img src={photoUrl} alt="" loading="lazy" className="size-full object-cover" /> : coachInitials(name)}
    </span>
  )
}
