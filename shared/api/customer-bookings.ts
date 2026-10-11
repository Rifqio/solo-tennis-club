import type { EffectiveBookingStatus } from '../booking-rules.ts'

// GET /api/customer/bookings?view=upcoming|history and GET /api/customer/bookings/:id. Only the signed-in
// customer's own bookings; times are ISO instants, the date and times are WIB.
export type CustomerBookingView = 'upcoming' | 'history'

export interface CustomerBookingSession {
  id: string
  className: string
  levelName: string
  venueName: string
  venueAddress: string | null
  venueMapUrl: string | null
  date: string
  startTime: string
  endTime: string
  startsAt: string
  endsAt: string
  cancelled: boolean
}

export interface CustomerBookingItem {
  id: string
  status: EffectiveBookingStatus
  quantity: number
  unitPriceIdr: number
  totalPriceIdr: number
  originalDeadline: string
  createdAt: string
  participants: string[]
  session: CustomerBookingSession
}

export interface CustomerBookingListResponse {
  view: CustomerBookingView
  items: CustomerBookingItem[]
  // Opaque; pass back as ?cursor= for the next page of history. Null when there is no more.
  nextCursor: string | null
  serverNow: string
}

export interface CustomerBookingDetailResponse {
  booking: CustomerBookingItem
  // The admin's reason on the latest rejected proof, if any (the member reads it on the booking, 9h).
  rejection: { reason: 'amount_mismatch' | 'unreadable' | 'not_received' | 'other'; note: string | null } | null
  serverNow: string
}
