import type { EffectiveBookingStatus } from '../booking-rules.ts'

// GET /api/admin/bookings?status=unpaid|confirmed|all&cursor=&limit= and GET /api/admin/bookings/:id.
// unpaid: still holding places, nearest deadline first. confirmed and all: newest booking first.
export type AdminBookingFilter = 'unpaid' | 'confirmed' | 'all'

export interface AdminBookingSummary {
  id: string
  status: EffectiveBookingStatus
  bookerName: string
  bookerPhone: string
  quantity: number
  totalPriceIdr: number
  originalDeadline: string
  createdAt: string
  // 'customer' when booked in the app, 'admin' when an admin recorded it.
  source: 'customer' | 'admin'
  session: { id: string; className: string; date: string; startTime: string; startsAt: string; cancelled: boolean }
}

export interface AdminBookingListResponse {
  filter: AdminBookingFilter
  items: AdminBookingSummary[]
  nextCursor: string | null
  // Bookings still waiting for payment, for the filter badge.
  unpaidCount: number
  serverNow: string
}

export interface AdminBookingDetailResponse {
  booking: AdminBookingSummary & {
    unitPriceIdr: number
    participants: string[]
    // The app account the booking belongs to, if any. A booking an admin recorded has none until it is linked.
    customer: { displayName: string; phone: string; verifiedAt: string } | null
    session: AdminBookingSummary['session'] & { levelName: string; venueName: string; endTime: string }
  }
  serverNow: string
}
