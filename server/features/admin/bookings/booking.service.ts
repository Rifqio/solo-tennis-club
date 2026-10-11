import type { Database } from '../../../database/transaction.ts'
import { inTransaction } from '../../../database/transaction.ts'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { ApiError } from '../../../http/errors.ts'
import { clubDateOf, clubTimeOf } from '../../../../shared/club-time.ts'
import { effectiveBookingStatus } from '../../../../shared/booking-rules.ts'
import type { AdminBookingDetailResponse, AdminBookingFilter, AdminBookingListResponse, AdminBookingSummary, AdminProof } from '../../../../shared/api/admin-bookings.ts'
import type { ProofRejectionReason } from '../../../../shared/api/customer-payments.ts'
import { createAdminBookingRepository } from './booking.repository.ts'
import type { AdminBookingDetailRow, AdminBookingRow, Cursor } from './booking.repository.ts'

export const LIST_DEFAULT = 20
export const LIST_MAX = 50

function toSummary(row: AdminBookingRow, now: Date): AdminBookingSummary {
  return {
    id: row.id,
    status: effectiveBookingStatus(row.status, row.originalDeadline, now),
    bookerName: row.bookerName,
    bookerPhone: row.bookerPhone,
    quantity: row.quantity,
    totalPriceIdr: row.totalPriceIdr,
    originalDeadline: row.originalDeadline.toISOString(),
    createdAt: row.createdAt.toISOString(),
    source: row.actorKind === 'admin' ? 'admin' : 'customer',
    session: {
      id: row.session.id,
      className: row.session.class.name,
      date: clubDateOf(row.session.startsAt),
      startTime: clubTimeOf(row.session.startsAt),
      startsAt: row.session.startsAt.toISOString(),
      cancelled: row.session.status !== 'scheduled',
    },
  }
}

function encodeCursor(at: Date, id: string) {
  return Buffer.from(JSON.stringify([at.toISOString(), id])).toString('base64url')
}
function decodeCursor(cursor: string): Cursor {
  try {
    const [at, id] = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown[]
    const date = new Date(String(at))
    if (typeof id !== 'string' || !/^[a-z0-9]{1,64}$/.test(id) || Number.isNaN(date.getTime())) throw new Error('bad cursor')
    return { at: date, id }
  } catch {
    throw new ApiError(400, 'VALIDATION_FAILED', { cursor: 'INVALID_FORMAT' })
  }
}

export async function listAdminBookings(database: PrismaClient, input: { filter: AdminBookingFilter; cursor: string | null; limit: number; search?: string | null }, now = new Date()): Promise<AdminBookingListResponse> {
  return inTransaction(database, async transaction => {
    const repository = createAdminBookingRepository(transaction)
    const after = input.cursor ? decodeCursor(input.cursor) : null
    const counts = { unpaidCount: await repository.countUnpaid(now), reviewCount: await repository.countForReview() }
    if (input.filter === 'review') {
      const proofs = await repository.listForReview(input.limit + 1, after, input.search ?? null)
      const page = proofs.slice(0, input.limit)
      const last = page[page.length - 1]
      return {
        filter: input.filter,
        items: page.map(proof => toSummary(proof.booking, now)),
        nextCursor: proofs.length > input.limit && last ? encodeCursor(last.submittedAt, last.id) : null,
        ...counts,
        serverNow: now.toISOString(),
      }
    }
    const rows = input.filter === 'unpaid'
      ? await repository.listUnpaid(now, input.limit + 1, after, input.search ?? null)
      : await repository.listRecent(input.filter === 'confirmed' ? 'confirmed' : null, input.limit + 1, after, input.search ?? null)
    const page = rows.slice(0, input.limit)
    const last = page[page.length - 1]
    return {
      filter: input.filter,
      items: page.map(row => toSummary(row, now)),
      nextCursor: rows.length > input.limit && last ? encodeCursor(input.filter === 'unpaid' ? last.originalDeadline : last.createdAt, last.id) : null,
      ...counts,
      serverNow: now.toISOString(),
    }
  })
}

function toLinked(event: AdminBookingDetailRow['ownershipEvents'][number] | undefined) {
  if (!event) return null
  return { at: event.createdAt.toISOString(), by: event.admin?.displayName ?? null }
}

function toDetail(row: AdminBookingDetailRow, now: Date): AdminBookingDetailResponse['booking'] {
  const summary = toSummary(row, now)
  const endsAt = new Date(row.session.startsAt.getTime() + row.session.durationMinutes * 60_000)
  return {
    ...summary,
    unitPriceIdr: row.unitPriceIdr,
    participants: row.participants.map(participant => participant.name),
    customer: row.customer ? { displayName: row.customer.displayName, phone: row.customer.phone, verifiedAt: row.customer.verifiedAt.toISOString() } : null,
    linked: toLinked(row.ownershipEvents[0]),
    version: row.version,
    session: { ...summary.session, levelName: row.session.level.name, venueName: row.session.venue.name, endTime: clubTimeOf(endsAt) },
    proofs: row.paymentProofs.map(proof => ({
      id: proof.id,
      submittedAt: proof.submittedAt.toISOString(),
      status: proof.status as AdminProof['status'],
      rejectionReason: proof.rejectionReason as ProofRejectionReason | null,
      rejectionNote: proof.rejectionNote,
      reviewed: proof.reviewedAt ? { at: proof.reviewedAt.toISOString(), by: proof.reviewedBy?.displayName ?? null } : null,
      files: proof.files,
    })),
    confirmed: row.confirmedAt ? { at: row.confirmedAt.toISOString(), by: row.confirmedBy?.displayName ?? null } : null,
    paymentNote: row.paymentNote,
  }
}

export async function getAdminBooking(database: Database, id: string, now = new Date()): Promise<AdminBookingDetailResponse> {
  if (!/^[a-z0-9]{1,64}$/.test(id)) throw new ApiError(404, 'NOT_FOUND')
  const row = await createAdminBookingRepository(database).findDetail(id)
  if (!row) throw new ApiError(404, 'NOT_FOUND')
  return { booking: toDetail(row, now), serverNow: now.toISOString() }
}
