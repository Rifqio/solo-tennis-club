import type { FieldErrorCode } from './api/errors.ts'
import type { ReferenceKind } from './api/admin-references.ts'
export const REFERENCE_LIMITS = { nameMax: 120, addressMax: 300 }
export function toNameKey(name: string) { return name.trim().replace(/\s+/g, ' ').toLowerCase() }
export function validateReferenceFields(kind: ReferenceKind, values: Record<string, unknown>): Record<string, FieldErrorCode> {
  const errors: Record<string, FieldErrorCode> = {}
  if (typeof values.name !== 'string' || !values.name.trim()) errors.name = 'REQUIRED'
  else if (values.name.trim().length > REFERENCE_LIMITS.nameMax) errors.name = 'TOO_LONG'
  if (kind === 'venue' && values.address != null && (typeof values.address !== 'string' || values.address.trim().length > REFERENCE_LIMITS.addressMax)) errors.address = 'TOO_LONG'
  return errors
}
