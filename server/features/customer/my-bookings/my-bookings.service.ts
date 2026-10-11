import type { Database } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import { clubDateOf, clubTimeOf } from '../../../../shared/club-time.ts'
import { effectiveBookingStatus } from '../../../../shared/booking-rules.ts'
import type { CustomerBookingDetailResponse, CustomerBookingItem, CustomerBookingListResponse, CustomerBookingView } from '../../../../shared/api/customer-bookings.ts'
import { createMyBookingsRepository } from './my-bookings.repository.ts'
import type { ProofRejectionReason } from '../../../../shared/api/customer-payments.ts'
import type { CustomerBookingRow } from './my-bookings.repository.ts'

export const UPCOMING_LIMIT = 50
export const HISTORY_DEFAULT = 20
export const HISTORY_MAX = 50

function toItem(row: CustomerBookingRow, now: Date): CustomerBookingItem {
  const { session } = row
  const endsAt = new Date(session.startsAt.getTime() + session.durationMinutes * 60_000)
  return {
    id: row.id,
    status: effectiveBookingStatus(row.status, row.originalDeadline, now),
    quantity: row.quantity,
    unitPriceIdr: row.unitPriceIdr,
    totalPriceIdr: row.totalPriceIdr,
    originalDeadline: row.originalDeadline.toISOString(),
    createdAt: row.createdAt.toISOString(),
    participants: row.participants.map(participant => participant.name),
    session: {
      id: session.id,
      className: session.class.name,
      levelName: session.level.name,
      venueName: session.venue.name,
      venueAddress: session.venue.address,
      venueMapUrl: session.venue.mapUrl,
      date: clubDateOf(session.startsAt),
      startTime: clubTimeOf(session.startsAt),
      endTime: clubTimeOf(endsAt),
      startsAt: session.startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      cancelled: session.status !== 'scheduled',
    },
  }
}

// The cursor is the last row's (createdAt, id), base64url so it travels as one opaque query value.
function encodeCursor(row: { createdAt: Date; id: string }) {
  return Buffer.from(JSON.stringify([row.createdAt.toISOString(), row.id])).toString('base64url')
}
export function decodeCursor(cursor: string): { createdAt: Date; id: string } {
  try {
    const [createdAt, id] = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown[]
    const date = new Date(String(createdAt))
    if (typeof id !== 'string' || !/^[a-z0-9]{1,64}$/.test(id) || Number.isNaN(date.getTime())) throw new Error('bad cursor')
    return { createdAt: date, id }
  } catch {
    throw new ApiError(400, 'VALIDATION_FAILED', { cursor: 'INVALID_FORMAT' })
  }
}

export async function listMyBookings(database: Database, customerId: string, input: { view: CustomerBookingView; cursor: string | null; limit: number }, now = new Date()): Promise<CustomerBookingListResponse> {
  const repository = createMyBookingsRepository(database)
  if (input.view === 'upcoming') {
    const rows = await repository.listUpcoming(customerId, now, UPCOMING_LIMIT)
    return { view: 'upcoming', items: rows.map(row => toItem(row, now)), nextCursor: null, serverNow: now.toISOString() }
  }
  const after = input.cursor ? decodeCursor(input.cursor) : null
  const rows = await repository.listHistory(customerId, now, input.limit + 1, after)
  const page = rows.slice(0, input.limit)
  return {
    view: 'history',
    items: page.map(row => toItem(row, now)),
    nextCursor: rows.length > input.limit ? encodeCursor(page[page.length - 1]) : null,
    serverNow: now.toISOString(),
  }
}

// Another customer's booking answers exactly like a missing one.
export async function getMyBooking(database: Database, customerId: string, id: string, now = new Date()): Promise<CustomerBookingDetailResponse> {
  if (!/^[a-z0-9]{1,64}$/.test(id)) throw new ApiError(404, 'NOT_FOUND')
  const row = await createMyBookingsRepository(database).findOwn(customerId, id)
  if (!row) throw new ApiError(404, 'NOT_FOUND')
  const rejected = row.paymentProofs[0]
  const rejection = rejected?.rejectionReason ? { reason: rejected.rejectionReason as ProofRejectionReason, note: rejected.rejectionNote } : null
  return { booking: toItem(row, now), rejection, serverNow: now.toISOString() }
}
