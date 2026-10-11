import { clubDateOf } from '@shared/club-time'
import type { AdminBookingDetailResponse, AdminBookingFilter } from '@shared/api/admin-bookings'
import { formatClubTime, formatClubWeekdayShort } from '@/i18n/format'
import type { Language } from '@/i18n/types'
import { adminBookingsMessages as messages } from './bookings.messages'

// The two facts on the blue header of a booking: its status, and when payment is due (the weekday only when that is
// not today).
export function bookingFacts({ booking, serverNow }: AdminBookingDetailResponse, language: Language) {
  const deadlineDate = clubDateOf(new Date(booking.originalDeadline))
  const deadline = `${deadlineDate === clubDateOf(new Date(serverNow)) ? '' : formatClubWeekdayShort(deadlineDate, language) + ' '}${formatClubTime(booking.originalDeadline)}`
  const status = booking.status === 'awaiting_payment' ? messages.unpaid : booking.status === 'confirmed' ? messages.confirmed : messages.expired
  return { status, deadline }
}

// wa.me takes the number as digits with the country code.
export function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits.startsWith('0') ? '62' + digits.slice(1) : digits}` : null
}

export const BOOKING_FILTERS: AdminBookingFilter[] = ['unpaid', 'confirmed', 'all']
