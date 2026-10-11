import type { AdminBookingFilter } from '@shared/api/admin-bookings'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { adminBookingsMessages as messages } from './bookings.messages'
import { BOOKING_FILTERS } from './booking-facts'
import { SelectionBase, SelectionMark } from '@/components/ui/selection-mark'

// The status filter on the band (boards 14, D6): white for the chosen one, with how many proofs wait for review (lime)
// and how many bookings are still unpaid (amber). The list
// changes at once; the white marker slides to the chosen filter.
export function BookingFilters({ filter, unpaidCount, reviewCount, onChange }: { filter: AdminBookingFilter; unpaidCount: number | null; reviewCount: number | null; onChange: (filter: AdminBookingFilter) => void }) {
  const { t } = useI18n()
  return (
    <div role="group" aria-label={t(messages.filter)} className="isolate flex flex-wrap gap-2">
      {BOOKING_FILTERS.map(value => {
        const on = value === filter
        return (
          <button key={value} type="button" aria-pressed={on} onClick={() => onChange(value)}
            className={cn('selection-item pressable flex min-h-12 shrink-0 items-center gap-2 rounded-full px-3.5 text-label font-semibold',
              on ? 'text-on-surface' : 'text-on-signboard')}>
            <SelectionBase className="rounded-full bg-band-tile" />
            {on && <SelectionMark layoutId="booking-filter" className="rounded-full bg-surface-container-lowest" />}
            {t(messages[value])}
            {value === 'unpaid' && unpaidCount != null && unpaidCount > 0 && (
              <span className="-mr-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-warning-container px-2 font-bold tabular-nums text-warning">{unpaidCount}</span>
            )}
            {value === 'review' && reviewCount != null && reviewCount > 0 && (
              <span className="-mr-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-2 font-bold tabular-nums text-on-accent">{reviewCount}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
