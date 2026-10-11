import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { basename, resolve, sep } from 'node:path'

// Payment proof files: private, never served by express.static. They live under
// <privateDir>/proofs/<bookingId>/<random>.<ext> beside the database, so a backup carries them (03-ARCHITECTURE §4).

export const PROOF_FILE_MAX_BYTES = 5 * 1024 * 1024
export const PROOF_FILES_MAX = 3

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

function bookingDir(privateDir: string, bookingId: string) {
  if (!bookingIdPattern.test(bookingId)) throw new Error('Invalid booking id for evidence storage')
  return resolve(privateDir, 'proofs', bookingId)
}

// The absolute path of a stored file, refusing any name this module did not create (no path tricks).
export function evidencePath(privateDir: string, bookingId: string, fileName: string) {
  if (!fileNamePattern.test(fileName) || basename(fileName) !== fileName) throw new Error('Invalid evidence file name')
  const dir = bookingDir(privateDir, bookingId)
  const path = resolve(dir, fileName)
  if (!path.startsWith(dir + sep)) throw new Error('Evidence path escapes its folder')
  return path
}

export interface StoredEvidence { fileName: string; kind: EvidenceKind; byteSize: number }

// Writes each file under a temporary name and renames it into place, so a half-written file is never visible.
// Callers commit the database rows afterwards and call removeEvidence if that fails.
export function storeEvidence(privateDir: string, bookingId: string, files: { bytes: Buffer; kind: EvidenceKind }[]): StoredEvidence[] {
  const dir = bookingDir(privateDir, bookingId)
  mkdirSync(dir, { recursive: true })
  const stored: StoredEvidence[] = []
  try {
    for (const file of files) {
      const fileName = `${randomBytes(16).toString('hex')}.${file.kind.extension}`
      const target = evidencePath(privateDir, bookingId, fileName)
      const temporary = `${target}.part`
      writeFileSync(temporary, file.bytes, { flag: 'wx' })
      renameSync(temporary, target)
      stored.push({ fileName, kind: file.kind, byteSize: file.bytes.length })
    }
    return stored
  } catch (error) {
    removeEvidence(privateDir, bookingId, stored.map(file => file.fileName))
    throw error
  }
}

export function removeEvidence(privateDir: string, bookingId: string, fileNames: string[]) {
  for (const fileName of fileNames) {
    const path = evidencePath(privateDir, bookingId, fileName)
    rmSync(path, { force: true })
    rmSync(`${path}.part`, { force: true })
  }
}

export function evidenceExists(privateDir: string, bookingId: string, fileName: string) {
  return existsSync(evidencePath(privateDir, bookingId, fileName))
}
