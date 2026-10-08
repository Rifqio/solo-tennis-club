export type AvailabilityStatus = 'available' | 'nearly_full' | 'full' | 'cancelled'
export function deriveAvailability(input: { sessionStatus: string; maxParticipants: number; remainingPlaces: number }): AvailabilityStatus {
  if (input.sessionStatus === 'cancelled') return 'cancelled'
  if (input.remainingPlaces <= 0) return 'full'
  if (input.remainingPlaces * 4 <= input.maxParticipants) return 'nearly_full'
  return 'available'
}
