import type { CustomerBookingItem } from './customer-bookings.ts'

// Payment proof limits (03-DECISIONS §2): JPG, PNG or PDF, up to 5 MB each, up to 3 files per submission.
export const PROOF_FILE_MAX_BYTES = 5 * 1024 * 1024
export const PROOF_FILES_MAX = 3
export const PROOF_CONTENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const

// Why an admin rejected a proof (03-DECISIONS §4); shown to the member word for word.
export type ProofRejectionReason = 'amount_mismatch' | 'unreadable' | 'not_received' | 'other'

export interface ProofFileSummary { id: string; originalName: string; contentType: string; byteSize: number }

export interface ProofSummary {
  id: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason: ProofRejectionReason | null
  rejectionNote: string | null
  files: ProofFileSummary[]
}

// GET /api/customer/bookings/:id/payment: what to pay and the proof so far. `canSubmit` is true while the booking
// is unpaid or needs a corrected proof and its original deadline has not passed.
export interface CustomerPaymentResponse {
  booking: CustomerBookingItem
  latestProof: ProofSummary | null
  canSubmit: boolean
  serverNow: string
}

// POST /api/customer/bookings/:id/proofs (multipart/form-data: submissionId, files). A repeat of the same
// submissionId returns the first result with `replayed`.
export interface ProofSubmissionResponse {
  booking: CustomerBookingItem
  proof: ProofSummary
  replayed: boolean
  serverNow: string
}
