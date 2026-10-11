import type { AdminBookingSummary } from '@shared/api/admin-bookings'
import { formatClubTime } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { adminBookingsMessages as messages } from './bookings.messages'

// A booking's payment state on Booking masuk rows (phone and desktop): what is owed and by when, a proof to check,
// paid, or over. Colour always comes with words (G1).
export function BookingStatusChip({ booking, className }: { booking: Pick<AdminBookingSummary, 'status' | 'originalDeadline'>; className?: string }) {
  const { t } = useI18n()
  const time = formatClubTime(booking.originalDeadline)
  const [label, tone] = booking.status === 'awaiting_payment' ? [t(messages.due, { time }), 'bg-warning-container font-bold tabular-nums text-warning']
    : booking.status === 'needs_correction' ? [t(messages.correctionDue, { time }), 'border border-warning font-bold tabular-nums text-warning']
    : booking.status === 'awaiting_verification' ? [t(messages.review), 'bg-primary-container font-bold text-primary']
    : booking.status === 'confirmed' ? [t(messages.confirmed), 'bg-band-tile font-semibold text-on-signboard']
    : [t(messages.expired), 'bg-surface-container-high font-semibold text-on-surface-variant']
  return <span className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 text-label', tone, className)}>{label}</span>
}
