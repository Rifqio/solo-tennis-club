import type { Database } from '../../database/transaction.ts'
import { DEADLINE_BOUND_STATUSES } from '../../../shared/booking-rules.ts'

export const proofFields = {
  id: true, submittedAt: true, status: true, rejectionReason: true, rejectionNote: true,
  files: { select: { id: true, originalName: true, contentType: true, byteSize: true }, orderBy: { position: 'asc' } },
} as const

export function createProofRepository(database: Database) {
  return {
    // The booking a member may pay for: their own, with what decides whether a proof can still be sent.
    findPayable(customerId: string, bookingId: string) {
      return database.booking.findFirst({
        where: { id: bookingId, customerId },
        select: { id: true, status: true, originalDeadline: true, version: true, session: { select: { status: true } } },
      })
    },
    findLatest(bookingId: string) {
      return database.paymentProof.findFirst({ where: { bookingId }, orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }], select: proofFields })
    },
    findBySubmission(bookingId: string, submissionId: string) {
      return database.paymentProof.findUnique({ where: { bookingId_submissionId: { bookingId, submissionId } }, select: proofFields })
    },
    // Moves the booking to awaiting_verification only while it is still payable at `now`. The guard makes a race with
    // the deadline, the expiry worker or a second submission lose cleanly (count 0).
    markAwaitingVerification(bookingId: string, now: Date) {
      return database.booking.updateMany({
        where: { id: bookingId, status: { in: [...DEADLINE_BOUND_STATUSES] }, originalDeadline: { gt: now }, session: { status: 'scheduled' } },
        data: { status: 'awaiting_verification', version: { increment: 1 } },
      })
    },
    createProof(input: { bookingId: string; customerId: string; submissionId: string; submittedAt: Date; files: { position: number; fileName: string; originalName: string; contentType: string; byteSize: number }[] }) {
      const { files, ...proof } = input
      return database.paymentProof.create({ data: { ...proof, files: { create: files } }, select: proofFields })
    },
  }
}
