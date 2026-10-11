import type { EffectiveBookingStatus } from '../booking-rules.ts'
import type { BookingOptionsResponse } from './booking-admission.ts'
import type { ProofFileSummary, ProofRejectionReason } from './customer-payments.ts'

// GET /api/admin/bookings?status=review|unpaid|confirmed|all&q=&cursor=&limit= and GET /api/admin/bookings/:id.
// q: part of the booker's name, or of their phone number.
// review: a proof waits for an admin, oldest proof first. unpaid: still owes payment before its deadline, nearest
// deadline first. confirmed and all: newest booking first.
export type AdminBookingFilter = 'review' | 'unpaid' | 'confirmed' | 'all'

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
  // Bookings still waiting for payment, and proofs waiting for an admin, for the filter badges.
  unpaidCount: number
  reviewCount: number
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
    // Every proof sent for this booking, newest first, and when and by whom it was confirmed.
    proofs: AdminProof[]
    confirmed: { at: string; by: string | null } | null
    paymentNote: string | null
  }
  serverNow: string
}

export interface AdminProof {
  id: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason: ProofRejectionReason | null
  rejectionNote: string | null
  reviewed: { at: string; by: string | null } | null
  // Read through GET /api/admin/proofs/:proofId/files/:fileId.
  files: ProofFileSummary[]
}

// POST /api/admin/bookings/:id/proofs/:proofId/approve and .../reject. `version` is the booking's, so a review never
// lands on a booking that changed meanwhile. Reject needs a reason; 'other' needs a note.
export interface AdminApproveProofRequest { version: number }
export interface AdminRejectProofRequest { version: number; reason: ProofRejectionReason; note?: string }
// What the review did: confirmed (approved), needs_correction (rejected before the deadline: the member can send a new
// proof), or expired (rejected after the deadline: the places were released, PAY-08).
export interface AdminProofReviewResponse extends AdminBookingDetailResponse {
  outcome: 'confirmed' | 'needs_correction' | 'expired'
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
