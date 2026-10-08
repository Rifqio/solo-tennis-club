import { expect, test } from 'vitest'
import { validateSessionFields } from '../../shared/session-rules.ts'
import { addClubDays } from '../../shared/club-time.ts'
const context = { today: '2026-10-08', now: new Date('2026-10-08T05:00:00Z') }
const valid = { createRequestId: '099dba86-605e-4c2b-859c-a3ecfb6c38ec', classId: 'class', levelId: 'level', venueId: 'venue', coachIds: ['coach'], date: '2026-10-09', startTime: '18:00', durationMinutes: 90, priceIdr: 150000, minParticipants: 4, maxParticipants: 8 }
test('participants accept touching limits and exact boundaries 1 and 500; reject 0 and 501', () => {
  for (const count of [1, 500]) expect(validateSessionFields({ ...valid, minParticipants: count, maxParticipants: count }, context)).toEqual({})
  for (const count of [0, 501]) expect(validateSessionFields({ ...valid, minParticipants: count, maxParticipants: count }, context)).toMatchObject({ minParticipants: 'OUT_OF_RANGE', maxParticipants: 'OUT_OF_RANGE' })
  expect(validateSessionFields({ ...valid, minParticipants: 9, maxParticipants: 8 }, context)).toEqual({ minParticipants: 'MIN_EXCEEDS_MAX' })
})
test('missing or null counts are REQUIRED and multiple fields are reported independent of input order', () => {
  for (const value of [null, undefined]) expect(validateSessionFields({ ...valid, minParticipants: value, maxParticipants: value }, context)).toMatchObject({ minParticipants: 'REQUIRED', maxParticipants: 'REQUIRED' })
  const invalid = { ...valid, minParticipants: 0, maxParticipants: 501, durationMinutes: 14, priceIdr: -1, coachIds: [] }
  const expected = { minParticipants: 'OUT_OF_RANGE', maxParticipants: 'OUT_OF_RANGE', durationMinutes: 'OUT_OF_RANGE', priceIdr: 'OUT_OF_RANGE', coachIds: 'COACH_REQUIRED' }
  expect(validateSessionFields(invalid, context)).toEqual(expected)
  expect(validateSessionFields(Object.fromEntries(Object.entries(invalid).reverse()), context)).toEqual(expected)
})
test('safe integer precision never rounds or coerces 4.5, "8", 1e21 or NaN-like input', () => {
  for (const value of [4.5, '8', 1e21, NaN, Infinity, 'NaN']) for (const field of ['minParticipants', 'maxParticipants', 'durationMinutes', 'priceIdr']) expect(validateSessionFields({ ...valid, [field]: value }, context)[field]).toBe('INVALID_INTEGER')
})
test('duration boundaries 15 and 720 accepted; 14 and 721 rejected', () => {
  for (const durationMinutes of [15, 720]) expect(validateSessionFields({ ...valid, durationMinutes }, context)).toEqual({})
  for (const durationMinutes of [14, 721]) expect(validateSessionFields({ ...valid, durationMinutes }, context)).toMatchObject({ durationMinutes: 'OUT_OF_RANGE' })
})
test('integer IDR boundaries 0 and 100000000 accepted; -1 and 100000001 rejected', () => {
  for (const priceIdr of [0, 100000000]) expect(validateSessionFields({ ...valid, priceIdr }, context)).toEqual({})
  for (const priceIdr of [-1, 100000001]) expect(validateSessionFields({ ...valid, priceIdr }, context)).toMatchObject({ priceIdr: 'OUT_OF_RANGE' })
})
test('one coach accepted; empty coaches, duplicates and missing venue are field errors', () => {
  expect(validateSessionFields(valid, context)).toEqual({})
  expect(validateSessionFields({ ...valid, coachIds: [] }, context)).toEqual({ coachIds: 'COACH_REQUIRED' })
  expect(validateSessionFields({ ...valid, coachIds: ['a', 'a'] }, context)).toEqual({ coachIds: 'COACH_DUPLICATE' })
  expect(validateSessionFields({ ...valid, venueId: undefined }, context)).toEqual({ venueId: 'REQUIRED' })
})
test('real club date, 365-day horizon and future start time use WIB boundaries', () => {
  expect(validateSessionFields({ ...valid, date: '2026-02-30' }, context)).toEqual({ date: 'INVALID_FORMAT' })
  expect(validateSessionFields({ ...valid, date: '2026-10-07' }, context)).toEqual({ date: 'DATE_IN_PAST' })
  expect(validateSessionFields({ ...valid, date: addClubDays(context.today, 365) }, context)).toEqual({})
  expect(validateSessionFields({ ...valid, date: addClubDays(context.today, 366) }, context)).toEqual({ date: 'DATE_TOO_FAR' })
  for (const startTime of ['11:59', '12:00']) expect(validateSessionFields({ ...valid, date: context.today, startTime }, context)).toEqual({ startTime: 'DATE_IN_PAST' })
  expect(validateSessionFields({ ...valid, date: context.today, startTime: '12:01' }, context)).toEqual({})
  for (const startTime of ['00:00', '23:59']) expect(validateSessionFields({ ...valid, startTime }, context)).toEqual({})
  for (const startTime of ['24:00', '9:30', '12:60']) expect(validateSessionFields({ ...valid, startTime }, context)).toEqual({ startTime: 'INVALID_FORMAT' })
})
