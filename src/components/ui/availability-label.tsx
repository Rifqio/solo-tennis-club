import { commonMessages } from '@/i18n/common.messages'
import { formatRemainingPlaces } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { scheduleMessages } from '@/features/public/schedule/schedule.messages'
import type { AvailabilityStatus } from '@shared/availability'

// The fixed state cell: filled = open, half = nearly full, hollow = full, struck = cancelled. The mark only echoes the word beside it.
export function AvailabilityMark({ availability }: { availability: AvailabilityStatus }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0">
      {availability === 'available' && <circle cx="8" cy="8" r="7" fill="currentColor" />}
      {availability === 'nearly_full' && (
        <>
          <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 1a7 7 0 0 1 0 14z" fill="currentColor" />
        </>
      )}
      {availability === 'full' && <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />}
      {availability === 'cancelled' && (
        <>
          <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3.5 12.5l9-9" stroke="currentColor" strokeWidth="1.5" />
        </>
      )}
    </svg>
  )
}

const toneClasses: Record<AvailabilityStatus, string> = {
  available: 'text-primary',
  nearly_full: 'text-warning',
  full: 'text-on-surface',
  cancelled: 'text-on-surface-variant',
}

export function AvailabilityLabel({ availability, remainingPlaces, className }: { availability: AvailabilityStatus; remainingPlaces: number | null; className?: string }) {
  const { language, t } = useI18n()
  // "Full" already says zero places, and "Cancelled" has no places to count, so only open sessions carry a count.
  const showCount = availability === 'available' || availability === 'nearly_full'
  return (
    <p className={cn('flex flex-wrap items-center gap-x-3 gap-y-0.5 text-label sm:flex-col sm:items-start', className)}>
      <span className={cn('inline-flex items-center gap-1.5 font-bold', toneClasses[availability])}>
        <AvailabilityMark availability={availability} />
        {t(scheduleMessages.status[availability])}
      </span>
      {showCount && (remainingPlaces === null
        ? <span className="text-on-surface-variant">{t(commonMessages.unavailable)}</span>
        : <span className="tabular-nums text-on-surface">{formatRemainingPlaces(remainingPlaces, language)}</span>)}
    </p>
  )
}
