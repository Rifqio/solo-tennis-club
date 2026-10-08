import type { FieldErrorCode } from './api/errors.ts'
import { addClubDays, clubDateTimeToInstant, isClubDate } from './club-time.ts'
export const SESSION_LIMITS = { durationMinutes: { min: 15, max: 720 }, priceIdr: { min: 0, max: 100000000 }, participants: { min: 1, max: 500 }, horizonDays: 365 } as const
export function validateSessionFields(values: Record<string, unknown>, { today, now }: { today: string; now: Date }): Partial<Record<string, FieldErrorCode>> {
  const fields: Partial<Record<string, FieldErrorCode>> = {}
  const required = (value: unknown) => value === null || value === undefined || value === ''
  for (const field of ['classId', 'levelId', 'venueId']) {
    if (required(values[field])) fields[field] = 'REQUIRED'
    else if (typeof values[field] !== 'string' || !(values[field] as string).trim() || (values[field] as string).length > 128) fields[field] = 'INVALID_FORMAT'
  }
  for (const [field, limits] of Object.entries({ durationMinutes: SESSION_LIMITS.durationMinutes, priceIdr: SESSION_LIMITS.priceIdr, minParticipants: SESSION_LIMITS.participants, maxParticipants: SESSION_LIMITS.participants })) {
    const value = values[field]
    if (required(value)) fields[field] = 'REQUIRED'
    else if (!Number.isSafeInteger(value)) fields[field] = 'INVALID_INTEGER'
    else if ((value as number) < limits.min || (value as number) > limits.max) fields[field] = 'OUT_OF_RANGE'
  }
  if (!fields.minParticipants && !fields.maxParticipants && (values.minParticipants as number) > (values.maxParticipants as number)) fields.minParticipants = 'MIN_EXCEEDS_MAX'
  if (!Array.isArray(values.coachIds) || !values.coachIds.length) fields.coachIds = 'COACH_REQUIRED'
  else if (values.coachIds.some(id => typeof id !== 'string' || !id.trim() || id.length > 128)) fields.coachIds = 'INVALID_FORMAT'
  else if (new Set(values.coachIds).size !== values.coachIds.length) fields.coachIds = 'COACH_DUPLICATE'
  if (required(values.date)) fields.date = 'REQUIRED'
  else if (!isClubDate(values.date)) fields.date = 'INVALID_FORMAT'
  else if (values.date < today) fields.date = 'DATE_IN_PAST'
  else if (values.date > addClubDays(today, SESSION_LIMITS.horizonDays)) fields.date = 'DATE_TOO_FAR'
  if (required(values.startTime)) fields.startTime = 'REQUIRED'
  else if (typeof values.startTime !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(values.startTime)) fields.startTime = 'INVALID_FORMAT'
  else if (!fields.date && values.date === today && clubDateTimeToInstant(today, values.startTime) <= now) fields.startTime = 'DATE_IN_PAST'
  return fields
}
