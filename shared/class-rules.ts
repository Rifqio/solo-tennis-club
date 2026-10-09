import { validateSessionFields } from './session-rules.ts'
import { validateReferenceFields } from './reference-rules.ts'
import type { FieldErrorCode } from './api/errors.ts'
export function validateClassFields(values: Record<string, unknown>): Record<string, FieldErrorCode> {
  const fields = validateReferenceFields('coach', values)
  const mapping = { levelId: 'defaultLevelId', venueId: 'defaultVenueId', durationMinutes: 'defaultDurationMinutes', priceIdr: 'defaultPriceIdr', minParticipants: 'defaultMinParticipants', maxParticipants: 'defaultMaxParticipants', coachIds: 'defaultCoachIds' }
  const errors = validateSessionFields({ classId: 'class', date: '2030-01-01', startTime: '12:00', ...Object.fromEntries(Object.entries(mapping).map(([key, field]) => [key, values[field]])) }, { today: '2030-01-01', now: new Date('2030-01-01T00:00:00Z') })
  for (const [key, field] of Object.entries(mapping)) if (errors[key]) fields[field] = errors[key]!
  return fields
}
