import { randomBytes } from 'node:crypto'
import type { FileStore } from '../../storage/file-store.ts'

// Payment proof files: private, never served as static files. They live under proofs/<bookingId>/<random>.<ext> in the
// private store: beside the database locally, so a backup carries them (03-ARCHITECTURE §4), or private Vercel Blob.

export { PROOF_FILE_MAX_BYTES, PROOF_FILES_MAX } from '../../../shared/api/customer-payments.ts'

export type EvidenceKind = { extension: 'jpg' | 'png' | 'pdf'; contentType: 'image/jpeg' | 'image/png' | 'application/pdf' }

// The file kind from its first bytes, never from its name or the declared type.
export function sniffEvidence(bytes: Buffer): EvidenceKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: 'jpg', contentType: 'image/jpeg' }
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { extension: 'png', contentType: 'image/png' }
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-') return { extension: 'pdf', contentType: 'application/pdf' }
  return null
}

const bookingIdPattern = /^[a-z0-9]{1,64}$/
const fileNamePattern = /^[a-f0-9]{32}\.(?:jpg|png|pdf)$/

// The storage key of a stored file, refusing any name this module did not create (no path tricks).
export function evidenceKey(bookingId: string, fileName: string) {
  if (!bookingIdPattern.test(bookingId)) throw new Error('Invalid booking id for evidence storage')
  if (!fileNamePattern.test(fileName)) throw new Error('Invalid evidence file name')
  return `proofs/${bookingId}/${fileName}`
}

export interface StoredEvidence { fileName: string; kind: EvidenceKind; byteSize: number }

// Stores each file under a random name. Callers commit the database rows afterwards and call removeEvidence if that
// fails; a file that fails half-way removes the ones already stored.
export async function storeEvidence(files: FileStore, bookingId: string, incoming: { bytes: Buffer; kind: EvidenceKind }[]): Promise<StoredEvidence[]> {
  const stored: StoredEvidence[] = []
  try {
    for (const file of incoming) {
      const fileName = `${randomBytes(16).toString('hex')}.${file.kind.extension}`
      await files.put(evidenceKey(bookingId, fileName), file.bytes, file.kind.contentType)
      stored.push({ fileName, kind: file.kind, byteSize: file.bytes.length })
    }
    return stored
  } catch (error) {
    await removeEvidence(files, bookingId, stored.map(file => file.fileName))
    throw error
  }
}

export async function removeEvidence(files: FileStore, bookingId: string, fileNames: string[]) {
  await files.remove(fileNames.map(fileName => evidenceKey(bookingId, fileName)))
}

export function readEvidence(files: FileStore, bookingId: string, fileName: string) {
  return files.read(evidenceKey(bookingId, fileName))
}
