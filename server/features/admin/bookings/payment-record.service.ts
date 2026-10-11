import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { inWriteTransaction } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import { clubDateOf } from '../../../../shared/club-time.ts'
import { effectiveBookingStatus } from '../../../../shared/booking-rules.ts'
import type { AdminRecordPaymentRequest, AdminRecordPaymentResponse } from '../../../../shared/api/admin-bookings.ts'
import { createAdmissionRepository } from '../../booking-admission/admission.repository.ts'
import { createAdminBookingRepository } from './booking.repository.ts'
import { getAdminBooking } from './booking.service.ts'

// Records a payment received outside the app (OPER-08) and confirms the booking, in one transaction:
// - unpaid, needs-correction or under review: confirmed straight away (a pending proof counts as reviewed by it);
// - past its deadline: revived only if its places are still free, checked under the same session write lock as a new
//   booking, so a revival can never overbook (else CAPACITY_UNAVAILABLE: re-book instead);
// - already paid, or on a cancelled session: BOOKING_NOT_PAYABLE.
// The same requestId returns the first result, so a retry after a lost reply never records twice.
export async function recordPayment(database: PrismaClient, input: AdminRecordPaymentRequest & { bookingId: string; adminId: string }, clock: () => Date = () => new Date()): Promise<AdminRecordPaymentResponse> {
  const replayed = await inWriteTransaction(database, async transaction => {
    const repository = createAdminBookingRepository(transaction)
    const prior = await repository.findPaymentRecord(input.requestId)
    if (prior) {
      if (prior.bookingId !== input.bookingId || prior.amountIdr !== input.amountIdr || prior.method !== input.method || prior.paidOn !== input.paidOn) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT')
      return true
    }
    const booking = await repository.findForPayment(input.bookingId)
    if (!booking) throw new ApiError(404, 'NOT_FOUND')
    const now = clock()
    if (input.paidOn > clubDateOf(now)) throw new ApiError(400, 'VALIDATION_FAILED', { paidOn: 'DATE_TOO_FAR' })
    if (booking.version !== input.version) throw new ApiError(409, 'STALE_VERSION', undefined, await getAdminBooking(transaction, input.bookingId, now))
    if (booking.session.status !== 'scheduled' || booking.status === 'confirmed') throw new ApiError(409, 'BOOKING_NOT_PAYABLE')

    if (effectiveBookingStatus(booking.status, booking.originalDeadline, now) === 'expired') {
      const admission = createAdmissionRepository(transaction)
      await admission.acquireSessionCapacityWrite(booking.sessionId)
      const occupied = await admission.occupiedPlaces(booking.sessionId, now)
      if (booking.quantity > booking.session.maxParticipants - occupied) throw new ApiError(409, 'CAPACITY_UNAVAILABLE')
    }

    const settled = await repository.confirmAtVersion(input.bookingId, input.version, { confirmedAt: now, confirmedById: input.adminId, paymentNote: input.note?.trim() || null })
    if (settled.count !== 1) throw new ApiError(409, 'STALE_VERSION', undefined, await getAdminBooking(transaction, input.bookingId, now))
    for (const proof of booking.paymentProofs) {
      await repository.markProofReviewed(proof.id, { status: 'approved', reviewedAt: now, reviewedById: input.adminId })
    }
    await repository.createPaymentRecord({
      bookingId: input.bookingId, method: input.method, amountIdr: input.amountIdr, paidOn: input.paidOn,
      note: input.note?.trim() || null, requestId: input.requestId, recordedById: input.adminId, recordedAt: now,
    })
    return false
  })
  return { ...(await getAdminBooking(database, input.bookingId, clock())), replayed }
}
