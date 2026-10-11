import type { AdminBookingFilter } from '@shared/api/admin-bookings'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { adminBookingsMessages as messages } from './bookings.messages'
import { BOOKING_FILTERS } from './booking-facts'

// The status filter on the band (boards 14, D6): white for the chosen one, with how many are still unpaid.
export function BookingFilters({ filter, unpaidCount, onChange }: { filter: AdminBookingFilter; unpaidCount: number | null; onChange: (filter: AdminBookingFilter) => void }) {
  const { t } = useI18n()
  return (
    <div role="group" aria-label={t(messages.filter)} className="flex flex-wrap gap-2">
      {BOOKING_FILTERS.map(value => {
        const on = value === filter
        return (
          <button key={value} type="button" aria-pressed={on} onClick={() => onChange(value)}
            className={cn('state-layer pressable flex min-h-12 shrink-0 items-center gap-2 rounded-full px-3.5 text-label font-semibold',
              on ? 'bg-surface-container-lowest text-on-surface' : 'bg-band-tile text-on-signboard')}>
            {t(messages[value])}
            {value === 'unpaid' && unpaidCount != null && unpaidCount > 0 && (
              <span className="-mr-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-warning-container px-2 font-bold tabular-nums text-warning">{unpaidCount}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
