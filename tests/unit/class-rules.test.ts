import { expect, test } from 'vitest'
import { validateClassFields } from '../../shared/class-rules.ts'
import { toNameKey, validateReferenceFields } from '../../shared/reference-rules.ts'
const valid = { name: 'Test class', defaultLevelId: 'level', defaultVenueId: 'venue', defaultDurationMinutes: 90, defaultPriceIdr: 0, defaultMinParticipants: 1, defaultMaxParticipants: 1, defaultCoachIds: ['coach'] }
test('class and reference rules normalize names and keep exact session bounds without coercion', () => {
  expect(toNameKey(' Coach   A ')).toBe('coach a')
  expect(validateReferenceFields('venue', { name: ' ', address: 'x'.repeat(301) })).toEqual({ name: 'REQUIRED', address: 'TOO_LONG' })
  expect(validateClassFields(valid)).toEqual({})
  for (const [field, value, code] of [['defaultDurationMinutes',14,'OUT_OF_RANGE'],['defaultDurationMinutes',721,'OUT_OF_RANGE'],['defaultPriceIdr',-1,'OUT_OF_RANGE'],['defaultPriceIdr',100000001,'OUT_OF_RANGE'],['defaultMaxParticipants',501,'OUT_OF_RANGE'],['defaultMinParticipants',0,'OUT_OF_RANGE'],['defaultMaxParticipants',4.5,'INVALID_INTEGER'],['defaultMaxParticipants','8','INVALID_INTEGER']] as const) expect(validateClassFields({ ...valid, [field]: value })[field]).toBe(code)
  for (const [duration, price, max] of [[15,0,1],[720,100000000,500]]) expect(validateClassFields({ ...valid, defaultDurationMinutes: duration, defaultPriceIdr: price, defaultMaxParticipants: max })).toEqual({})
  expect(validateClassFields({ ...valid, defaultMinParticipants: 2 }).defaultMinParticipants).toBe('MIN_EXCEEDS_MAX')
  expect(validateClassFields({ ...valid, defaultCoachIds: [] }).defaultCoachIds).toBe('COACH_REQUIRED')
  expect(validateClassFields({ ...valid, defaultCoachIds: ['coach','coach'] }).defaultCoachIds).toBe('COACH_DUPLICATE')
})
