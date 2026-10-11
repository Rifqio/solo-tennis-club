import type { Database } from '../../database/transaction.ts'
import { ApiError } from '../../http/errors.ts'
import { evidenceExists, evidencePath } from './evidence-storage.ts'
import { createEvidenceRepository } from './evidence.repository.ts'

export interface EvidenceFile { path: string; contentType: string; originalName: string }

const idPattern = /^[a-z0-9]{1,64}$/

type FoundFile = { fileName: string; originalName: string; contentType: string; proof: { bookingId: string } } | null

function toEvidence(privateDir: string, file: FoundFile): EvidenceFile {
  // A row without its file (lost from disk) answers like a missing one.
  if (!file || !evidenceExists(privateDir, file.proof.bookingId, file.fileName)) throw new ApiError(404, 'NOT_FOUND')
  return { path: evidencePath(privateDir, file.proof.bookingId, file.fileName), contentType: file.contentType, originalName: file.originalName }
}

// Another customer's proof answers exactly like a missing one: 404, never 403, so nothing is revealed (AUTH-05).
export async function readCustomerEvidence(database: Database, privateDir: string, customerId: string, ids: { bookingId: string; proofId: string; fileId: string }) {
  if (![ids.bookingId, ids.proofId, ids.fileId].every(id => idPattern.test(id))) throw new ApiError(404, 'NOT_FOUND')
  return toEvidence(privateDir, await createEvidenceRepository(database).findForCustomer(customerId, ids.bookingId, ids.proofId, ids.fileId))
}

export async function readAdminEvidence(database: Database, privateDir: string, ids: { proofId: string; fileId: string }) {
  if (![ids.proofId, ids.fileId].every(id => idPattern.test(id))) throw new ApiError(404, 'NOT_FOUND')
  return toEvidence(privateDir, await createEvidenceRepository(database).findForAdmin(ids.proofId, ids.fileId))
}
