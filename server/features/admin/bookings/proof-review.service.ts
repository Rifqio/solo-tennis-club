import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { inWriteTransaction } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import type { AdminProofReviewResponse } from '../../../../shared/api/admin-bookings.ts'
import type { ProofRejectionReason } from '../../../../shared/api/customer-payments.ts'
import { createAdminBookingRepository } from './booking.repository.ts'
import { getAdminBooking } from './booking.service.ts'

type Decision = { kind: 'approve' } | { kind: 'reject'; reason: ProofRejectionReason; note: string | null }

// Reviews a proof against the booking version the admin saw (PAY-05, PAY-06, PAY-08), in one transaction:
// - approve: the booking becomes confirmed (Lunas);
// - reject before the original deadline: needs_correction, so the member can send a new proof in the time left;
// - reject after it: expired, so the places are released and no correction is offered.
// A booking that changed meanwhile (the member resubmitted, another admin reviewed) answers STALE_VERSION with the
// latest detail; a cancelled session is never confirmed.
export async function reviewProof(database: PrismaClient, input: { bookingId: string; proofId: string; version: number; adminId: string; decision: Decision }, now = new Date()): Promise<AdminProofReviewResponse> {
  const outcome = await inWriteTransaction(database, async transaction => {
    const repository = createAdminBookingRepository(transaction)
    const booking = await repository.findForReview(input.bookingId, input.proofId)
    if (!booking || booking.paymentProofs.length === 0) throw new ApiError(404, 'NOT_FOUND')
    const stale = async () => new ApiError(409, 'STALE_VERSION', undefined, await getAdminBooking(transaction, input.bookingId, now))
    if (booking.version !== input.version || booking.status !== 'awaiting_verification' || booking.paymentProofs[0]!.status !== 'pending') throw await stale()
    if (input.decision.kind === 'approve' && booking.session.status !== 'scheduled') throw new ApiError(409, 'BOOKING_NOT_PAYABLE')

    const result = input.decision.kind === 'approve' ? 'confirmed' as const
      : booking.originalDeadline > now ? 'needs_correction' as const : 'expired' as const
    const settled = await repository.settleReviewAtVersion(input.bookingId, input.version,
      result === 'confirmed' ? { status: result, confirmedAt: now, confirmedById: input.adminId } : { status: result })
    if (settled.count !== 1) throw await stale()
    await repository.markProofReviewed(input.proofId, input.decision.kind === 'approve'
      ? { status: 'approved', reviewedAt: now, reviewedById: input.adminId }
      : { status: 'rejected', reviewedAt: now, reviewedById: input.adminId, rejectionReason: input.decision.reason, rejectionNote: input.decision.note })
    return result
  })
  return { ...(await getAdminBooking(database, input.bookingId, now)), outcome }
}
