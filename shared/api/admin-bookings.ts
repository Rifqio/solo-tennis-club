import type { EffectiveBookingStatus } from '../booking-rules.ts'
import type { BookingOptionsResponse } from './booking-admission.ts'

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
    // When an admin gave this booking to the customer above, and who. Null for bookings made in the app.
    linked: { at: string; by: string | null } | null
    // Sent back with PUT /customer-link so a link never lands on a booking someone else just changed.
    version: number
    session: AdminBookingSummary['session'] & { levelName: string; venueName: string; endTime: string }
  }
  serverNow: string
}

// GET /api/admin/booking-options/:sessionId: what the admin booking form needs about one session.
export interface AdminBookingOptionsResponse extends BookingOptionsResponse {
  session: { id: string; className: string; levelName: string; venueName: string; date: string; startTime: string; endTime: string; startsAt: string; cancelled: boolean }
}

// POST /api/admin/bookings. The contact is what the customer gave on WhatsApp or at the desk. It is stored as typed
// (phone normalized) and is not a verified account: the booking has no owner until it is linked.
export interface AdminCreateBookingRequest {
  sessionId: string
  quantity: number
  participantNames: string[]
  expectedSessionVersion: number
  createRequestId: string
  bookerName: string
  bookerPhone: string
}

// GET /api/admin/verified-customers?phone=. Exact match on a normalized phone that finished sign-up; never a search.
export interface VerifiedCustomerLookupResponse {
  customer: { id: string; displayName: string; phone: string; verifiedAt: string } | null
}

// PUT /api/admin/bookings/:id/customer-link. Answers with the updated booking detail.
export interface AdminLinkCustomerRequest {
  customerId: string
  version: number
}
