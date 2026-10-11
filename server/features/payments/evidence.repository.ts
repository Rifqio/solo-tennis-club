import type { Database } from '../../database/transaction.ts'

const fileFields = { id: true, fileName: true, originalName: true, contentType: true, proof: { select: { bookingId: true } } } as const

export function createEvidenceRepository(database: Database) {
  return {
    // A proof file of a booking the customer owns; anyone else's lookup finds nothing (AUTH-05).
    findForCustomer(customerId: string, bookingId: string, proofId: string, fileId: string) {
      return database.paymentProofFile.findFirst({
        where: { id: fileId, proofId, proof: { bookingId, booking: { customerId } } },
        select: fileFields,
      })
    },
    findForAdmin(proofId: string, fileId: string) {
      return database.paymentProofFile.findFirst({ where: { id: fileId, proofId }, select: fileFields })
    },
  }
}
