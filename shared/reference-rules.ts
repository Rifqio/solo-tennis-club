import type { FieldErrorCode } from './api/errors.ts'
import type { ReferenceKind } from './api/admin-references.ts'
import { parseMapUrl } from './maps.ts'
export const REFERENCE_LIMITS = { nameMax: 120, addressMax: 300 }
export function toNameKey(name: string) { return name.trim().replace(/\s+/g, ' ').toLowerCase() }
export function validateReferenceFields(kind: ReferenceKind, values: Record<string, unknown>): Record<string, FieldErrorCode> {
  const errors: Record<string, FieldErrorCode> = {}
  if (typeof values.name !== 'string' || !values.name.trim()) errors.name = 'REQUIRED'
  else if (values.name.trim().length > REFERENCE_LIMITS.nameMax) errors.name = 'TOO_LONG'
  if (kind === 'venue' && values.address != null && (typeof values.address !== 'string' || values.address.trim().length > REFERENCE_LIMITS.addressMax)) errors.address = 'TOO_LONG'
  if (kind === 'venue' && values.mapUrl != null && values.mapUrl !== '') {
    const latitude = values.latitude, longitude = values.longitude
    if (typeof values.mapUrl !== 'string' || !parseMapUrl(values.mapUrl)) errors.mapUrl = 'INVALID_FORMAT'
    else if (typeof latitude !== 'number' || typeof longitude !== 'number' || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) errors.mapUrl = 'MAP_LINK_UNREADABLE'
  }
  return errors
}
