// Reserving places, shared by customers (POST /api/customer/bookings) and admins (POST /api/admin/bookings).
// Both go through one admission rule: same cutoff, same five-hour deadline, the whole group fits or nothing is saved.

export interface BookingOptionsResponse {
  sessionId: string
  sessionVersion: number
  unitPriceIdr: number
  remainingPlaces: number
  bookingClosesAt: string
  serverNow: string
  canReserve: boolean
}

export interface AdmittedBooking {
  id: string
  sessionId: string
  status: string
  quantity: number
  unitPriceIdr: number
  totalPriceIdr: number
  createdAt: string
  originalDeadline: string
  participants: { id: string; position: number; name: string }[]
}

// 201 on first save, 200 with replayed: true when the same request is sent again after a lost response.
export interface AdmittedBookingResponse {
  booking: AdmittedBooking
  replayed: boolean
  serverNow: string
}
