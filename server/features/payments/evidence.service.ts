import type { Database } from '../../database/transaction.ts'
import { ApiError } from '../../http/errors.ts'
import type { FileStore } from '../../storage/file-store.ts'
import { readEvidence } from './evidence-storage.ts'
import { createEvidenceRepository } from './evidence.repository.ts'

export interface EvidenceFile { bytes: Buffer; contentType: string; originalName: string }

const idPattern = /^[a-z0-9]{1,64}$/

type FoundFile = { fileName: string; originalName: string; contentType: string; proof: { bookingId: string } } | null

async function toEvidence(files: FileStore, file: FoundFile): Promise<EvidenceFile> {
  // A row without its file (lost from storage) answers like a missing one.
  const bytes = file && await readEvidence(files, file.proof.bookingId, file.fileName)
  if (!file || !bytes) throw new ApiError(404, 'NOT_FOUND')
  return { bytes, contentType: file.contentType, originalName: file.originalName }
}

// Another customer's proof answers exactly like a missing one: 404, never 403, so nothing is revealed (AUTH-05).
export async function readCustomerEvidence(database: Database, files: FileStore, customerId: string, ids: { bookingId: string; proofId: string; fileId: string }) {
  if (![ids.bookingId, ids.proofId, ids.fileId].every(id => idPattern.test(id))) throw new ApiError(404, 'NOT_FOUND')
  return toEvidence(files, await createEvidenceRepository(database).findForCustomer(customerId, ids.bookingId, ids.proofId, ids.fileId))
}

export async function readAdminEvidence(database: Database, files: FileStore, ids: { proofId: string; fileId: string }) {
  if (![ids.proofId, ids.fileId].every(id => idPattern.test(id))) throw new ApiError(404, 'NOT_FOUND')
  return toEvidence(files, await createEvidenceRepository(database).findForAdmin(ids.proofId, ids.fileId))
}
