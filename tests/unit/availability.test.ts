import { expect, test } from 'vitest'
import { deriveAvailability } from '../../shared/availability.ts'
test('availability uses the exact integer quarter-capacity boundary and cancelled precedence', () => {
  for (const [maxParticipants, remainingPlaces, expected] of [[8,3,'available'],[8,2,'nearly_full'],[8,1,'nearly_full'],[8,0,'full'],[7,2,'available'],[7,1,'nearly_full'],[1,1,'available'],[1,0,'full'],[4,1,'nearly_full'],[4,2,'available'],[8,-1,'full']] as const) expect(deriveAvailability({ sessionStatus: 'scheduled', maxParticipants, remainingPlaces })).toBe(expected)
  for (const remainingPlaces of [0,8]) expect(deriveAvailability({ sessionStatus: 'cancelled', maxParticipants: 8, remainingPlaces })).toBe('cancelled')
})
