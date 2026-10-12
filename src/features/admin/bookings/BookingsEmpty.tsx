import { EmptyState } from '@/components/ui/empty-state'
import type { StateScene } from '@/components/ui/empty-state'
import { useI18n } from '@/i18n/use-i18n'
import type { AdminBookingFilter } from '@shared/api/admin-bookings'
import { adminBookingsMessages as messages } from './bookings.messages'

// Booking masuk with nothing under the chosen filter (G3). Nothing to check or nobody waiting to pay is good news, so
// it is the ball landing in and takes no button; an empty paid or full list is simply a record not yet started.
const states: Record<AdminBookingFilter, { scene: StateScene; title: keyof typeof messages; body: keyof typeof messages }> = {
  review: { scene: 'all-clear', title: 'emptyReview', body: 'emptyReviewBody' },
  unpaid: { scene: 'all-clear', title: 'emptyUnpaid', body: 'emptyUnpaidBody' },
  confirmed: { scene: 'empty-history', title: 'emptyConfirmed', body: 'emptyConfirmedBody' },
  all: { scene: 'empty-history', title: 'emptyAll', body: 'emptyAllBody' },
}

// Switching filters is a choice inside the same screen, so the picture does not settle in again.
export function BookingsEmpty({ filter }: { filter: AdminBookingFilter }) {
  const { t } = useI18n()
  const state = states[filter]
  return <EmptyState scene={state.scene} still title={t(messages[state.title])} body={t(messages[state.body])} />
}
