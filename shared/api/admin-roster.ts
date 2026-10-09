export interface AdminRosterParticipant { id: string; position: number; name: string }
export interface AdminRosterBooking {
  id: string; bookerName: string; bookerPhone: string; quantity: number
  unitPriceIdr: number; totalPriceIdr: number; status: string
  originalDeadline: string; createdAt: string; participants: AdminRosterParticipant[]
}
export interface AdminRosterResponse {
  session: {
    id: string; className: string; levelName: string; date: string; durationMinutes: number
    venueName: string; venueAddress: string | null; coaches: string[]; priceIdr: number
    minParticipants: number; maxParticipants: number; status: string
  }
  bookings: AdminRosterBooking[]
  occupiedPlaces: number; remainingPlaces: number; serverNow: string; truncated: boolean
}
