import { createHash } from 'node:crypto'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { inTransaction, inWriteTransaction } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import { normalizeCustomerName } from '../../../../shared/customer-rules.ts'
import { createBookingRepository } from './booking.repository.ts'

const HOLD_MS = 5 * 60 * 60 * 1000
const BOOKING_CUTOFF_MS = HOLD_MS

export type ReservationInput = {
  sessionId: string
  quantity: number
  participantNames: string[]
  expectedSessionVersion: number
  createRequestId: string
}

function fingerprint(input: ReservationInput, names: string) {
  return createHash('sha256').update(JSON.stringify({ sessionId: input.sessionId, quantity: input.quantity, names, expectedSessionVersion: input.expectedSessionVersion })).digest('hex')
}

function toCustomerBooking(booking: Awaited<ReturnType<ReturnType<typeof createBookingRepository>['findByRequest']>>) {
  if (!booking) throw new Error('Expected a persisted customer booking')
  return {
    id: booking.id,
    sessionId: booking.sessionId,
    status: booking.status,
    quantity: booking.quantity,
    unitPriceIdr: booking.unitPriceIdr,
    totalPriceIdr: booking.totalPriceIdr,
    createdAt: booking.createdAt.toISOString(),
    originalDeadline: booking.originalDeadline.toISOString(),
    participants: booking.participants.map(({ id, position, name }) => ({ id, position, name })),
  }
}

export function createCustomerBookingService(database: PrismaClient, clock = () => new Date()) {
  async function getOptions(sessionId: string, now = clock()) {
    return inTransaction(database, async transaction => {
      const repository = createBookingRepository(transaction)
      const session = await repository.findSessionOptions(sessionId)
      if (!session) throw new ApiError(404, 'NOT_FOUND')
      const occupied = await repository.countActivePlaces(sessionId, now)
      const remainingPlaces = Math.max(0, session.maxParticipants - occupied)
      const bookingClosesAt = new Date(session.startsAt.getTime() - BOOKING_CUTOFF_MS)
      return { sessionId, sessionVersion: session.version, unitPriceIdr: session.priceIdr, remainingPlaces,
        bookingClosesAt: bookingClosesAt.toISOString(), serverNow: now.toISOString(),
        canReserve: session.status === 'scheduled' && now < bookingClosesAt && remainingPlaces > 0 }
    })
  }

  async function reserve(customer: { id: string; displayName: string; phone: string }, input: ReservationInput) {
    const names = input.participantNames.map(normalizeCustomerName)
    if (names.length !== input.quantity || names.some(name => !name)) throw new ApiError(400, 'VALIDATION_FAILED', { participantNames: 'INVALID_FORMAT' })
    const normalizedNames = names as string[]
    const canonicalNames = JSON.stringify(normalizedNames)
    const digest = fingerprint(input, canonicalNames)

    return inWriteTransaction(database, async transaction => {
      const repository = createBookingRepository(transaction)
      const locked = await repository.acquireSessionCapacityWrite(input.sessionId)
      if (!locked.count) throw new ApiError(404, 'NOT_FOUND')

      const prior = await repository.findByRequest(customer.id, input.createRequestId)
      if (prior) {
        if (prior.fingerprint !== digest) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT')
        return { booking: toCustomerBooking(prior), replayed: true, serverNow: clock().toISOString() }
      }

      const now = clock()
      const session = await repository.findSession(input.sessionId)
      if (!session) throw new ApiError(404, 'NOT_FOUND')
      const closesAt = session.startsAt.getTime() - BOOKING_CUTOFF_MS
      if (session.status !== 'scheduled' || now.getTime() >= closesAt) throw new ApiError(409, 'BOOKING_CLOSED')
      if (session.version !== input.expectedSessionVersion) throw new ApiError(409, 'SESSION_CHANGED')
      const total = session.priceIdr * input.quantity
      if (!Number.isSafeInteger(total) || total < 0) throw new ApiError(400, 'VALIDATION_FAILED', { quantity: 'OUT_OF_RANGE' })
      const occupied = await repository.countActivePlaces(session.id, now)
      if (input.quantity > session.maxParticipants - occupied) throw new ApiError(409, 'CAPACITY_UNAVAILABLE')

      const deadline = new Date(now.getTime() + HOLD_MS)
      const booking = await repository.create({ sessionId: session.id, customerId: customer.id, actorKind: 'customer', actorId: customer.id,
        createRequestId: input.createRequestId, fingerprint: digest, bookerName: customer.displayName, bookerPhone: customer.phone,
        quantity: input.quantity, unitPriceIdr: session.priceIdr, totalPriceIdr: total, originalDeadline: deadline }, normalizedNames)
      return { booking: toCustomerBooking(booking), replayed: false, serverNow: now.toISOString() }
    })
  }

  return { getOptions, reserve }
}

export type CustomerBookingService = ReturnType<typeof createCustomerBookingService>
