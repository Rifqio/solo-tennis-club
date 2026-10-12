import type { PrismaClient } from '../../generated/prisma/client.ts'
import { inWriteTransaction, isUniqueConstraintError } from '../../database/transaction.ts'
import { ApiError } from '../../http/errors.ts'
import { effectiveBookingStatus } from '../../../shared/booking-rules.ts'
import { PROOF_FILE_MAX_BYTES, PROOF_FILES_MAX } from '../../../shared/api/customer-payments.ts'
import type { CustomerPaymentResponse, ProofRejectionReason, ProofSubmissionResponse, ProofSummary } from '../../../shared/api/customer-payments.ts'
import { getMyBooking } from '../customer/my-bookings/my-bookings.service.ts'
import type { FileStore } from '../../storage/file-store.ts'
import { removeEvidence, sniffEvidence, storeEvidence } from './evidence-storage.ts'
import { createProofRepository } from './proof.repository.ts'

const idPattern = /^[a-z0-9]{1,64}$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type ProofRow = NonNullable<Awaited<ReturnType<ReturnType<typeof createProofRepository>['findLatest']>>>

export function toProofSummary(row: ProofRow): ProofSummary {
  return {
    id: row.id,
    submittedAt: row.submittedAt.toISOString(),
    status: row.status as ProofSummary['status'],
    rejectionReason: row.rejectionReason as ProofRejectionReason | null,
    rejectionNote: row.rejectionNote,
    files: row.files,
  }
}

// Whether a proof can be sent now: unpaid or needing a corrected proof, on a session that is still on, before the
// original deadline (which no rejection ever moves). Null when it can; otherwise the refusal code.
function refusalFor(booking: { status: string; originalDeadline: Date; session: { status: string } }, now: Date) {
  if (booking.session.status !== 'scheduled') return 'BOOKING_NOT_PAYABLE' as const
  const status = effectiveBookingStatus(booking.status, booking.originalDeadline, now)
  if (status === 'expired') return 'PAYMENT_DEADLINE_PASSED' as const
  return status === 'awaiting_payment' || status === 'needs_correction' ? null : 'BOOKING_NOT_PAYABLE' as const
}

export async function getPayment(database: PrismaClient, customerId: string, bookingId: string, now = new Date()): Promise<CustomerPaymentResponse> {
  if (!idPattern.test(bookingId)) throw new ApiError(404, 'NOT_FOUND')
  const repository = createProofRepository(database)
  const booking = await repository.findPayable(customerId, bookingId)
  if (!booking) throw new ApiError(404, 'NOT_FOUND')
  const [detail, latest] = await Promise.all([getMyBooking(database, customerId, bookingId, now), repository.findLatest(bookingId)])
  return { booking: detail.booking, latestProof: latest ? toProofSummary(latest) : null, canSubmit: refusalFor(booking, now) === null, serverNow: now.toISOString() }
}

export interface IncomingFile { bytes: Buffer; name: string }

// A proof counts when the server holds every file before the original deadline (03-DECISIONS §6). The files are
// stored first and the booking changes in one transaction afterwards; if that fails, the files are removed again.
export async function submitProof(database: PrismaClient, files: FileStore, customerId: string, bookingId: string,
  input: { submissionId: string; files: IncomingFile[] }, clock: () => Date = () => new Date()): Promise<ProofSubmissionResponse> {
  if (!idPattern.test(bookingId)) throw new ApiError(404, 'NOT_FOUND')
  if (!uuidPattern.test(input.submissionId)) throw new ApiError(400, 'VALIDATION_FAILED', { submissionId: 'INVALID_FORMAT' })
  const repository = createProofRepository(database)
  const booking = await repository.findPayable(customerId, bookingId)
  if (!booking) throw new ApiError(404, 'NOT_FOUND')

  // A retry of a submission that already arrived (the reply was lost) answers with the first result.
  const replay = await repository.findBySubmission(bookingId, input.submissionId)
  if (replay) return respond(database, customerId, bookingId, replay, true, clock())

  if (input.files.length === 0) throw new ApiError(400, 'VALIDATION_FAILED', { files: 'REQUIRED' })
  if (input.files.length > PROOF_FILES_MAX) throw new ApiError(400, 'VALIDATION_FAILED', { files: 'TOO_LONG' })
  const fields: Record<string, 'TOO_LONG' | 'INVALID_FORMAT'> = {}
  const checked = input.files.map((file, index) => {
    const kind = sniffEvidence(file.bytes)
    if (file.bytes.length > PROOF_FILE_MAX_BYTES) fields[`file${index}`] = 'TOO_LONG'
    else if (!kind) fields[`file${index}`] = 'INVALID_FORMAT'
    return { ...file, kind }
  })
  if (Object.keys(fields).length) throw new ApiError(400, 'VALIDATION_FAILED', fields)

  const refusal = refusalFor(booking, clock())
  if (refusal) throw new ApiError(409, refusal)

  const stored = await storeEvidence(files, bookingId, checked.map(file => ({ bytes: file.bytes, kind: file.kind! })))
  try {
    const proof = await inWriteTransaction(database, async transaction => {
      const now = clock()
      const proofs = createProofRepository(transaction)
      const changed = await proofs.markAwaitingVerification(bookingId, now)
      if (changed.count !== 1) {
        const current = await proofs.findPayable(customerId, bookingId)
        throw new ApiError(409, (current && refusalFor(current, now)) || 'PAYMENT_DEADLINE_PASSED')
      }
      return proofs.createProof({
        bookingId, customerId, submissionId: input.submissionId, submittedAt: now,
        files: stored.map((file, index) => ({
          position: index + 1, fileName: file.fileName, originalName: cleanName(checked[index]!.name, file.kind.extension),
          contentType: file.kind.contentType, byteSize: file.byteSize,
        })),
      })
    })
    return respond(database, customerId, bookingId, proof, false, clock())
  } catch (error) {
    await removeEvidence(files, bookingId, stored.map(file => file.fileName))
    // Two tabs sending the same submission at once: the second answers with the first one's result.
    if (isUniqueConstraintError(error)) {
      const first = await repository.findBySubmission(bookingId, input.submissionId)
      if (first) return respond(database, customerId, bookingId, first, true, clock())
    }
    throw error
  }
}

// The name shown back to the member and admins: the original file name without folders or odd characters.
function cleanName(name: string, extension: string) {
  const base = (name.split(/[\\/]/).pop() ?? '').replace(/[^\p{L}\p{N} ._-]+/gu, '').trim().slice(0, 80)
  return base || `bukti.${extension}`
}

async function respond(database: PrismaClient, customerId: string, bookingId: string, proof: ProofRow, replayed: boolean, now: Date): Promise<ProofSubmissionResponse> {
  const detail = await getMyBooking(database, customerId, bookingId, now)
  return { booking: detail.booking, proof: toProofSummary(proof), replayed, serverNow: now.toISOString() }
}
