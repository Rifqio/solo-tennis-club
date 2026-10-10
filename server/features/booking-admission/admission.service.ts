import { createHash } from 'node:crypto'
import type { Prisma, PrismaClient } from '../../generated/prisma/client.ts'
import { inTransaction, inWriteTransaction } from '../../database/transaction.ts'
import { ApiError } from '../../http/errors.ts'
import { normalizeCustomerName } from '../../../shared/customer-rules.ts'
import { BOOKING_CUTOFF_MS, RESERVATION_HOLD_MS } from '../../../shared/booking-rules.ts'
import type { AdmittedBooking, AdmittedBookingResponse, BookingOptionsResponse } from '../../../shared/api/booking-admission.ts'
import { createAdmissionRepository } from './admission.repository.ts'
import type { ActorKind, AdmittedBookingRow } from './admission.repository.ts'

export type AdmissionInput = {
  sessionId: string
  quantity: number
  participantNames: string[]
  expectedSessionVersion: number
  createRequestId: string
}

// Who is asking (scopes the request ID), who the booking belongs to (null until an admin links a verified customer),
// and the contact snapshot kept on the booking.
export type AdmissionRequest = {
  actor: { kind: ActorKind; id: string }
  customerId: string | null
  booker: { name: string; phone: string }
  input: AdmissionInput
}

function normalizedNames(input: AdmissionInput) {
  const names = input.participantNames.map(normalizeCustomerName)
  if (names.length !== input.quantity || names.some(name => !name)) {
    throw new ApiError(400, 'VALIDATION_FAILED', { participantNames: 'INVALID_FORMAT' })
  }
  return names as string[]
}

// Customer fingerprints predate admin bookings and stay byte-identical so a customer's in-flight retry still
// replays. An admin also types the contact, so it is part of what must match on replay.
function fingerprint(request: AdmissionRequest, names: string[]) {
  const { input } = request
  const content: Record<string, unknown> = { sessionId: input.sessionId, quantity: input.quantity, names: JSON.stringify(names), expectedSessionVersion: input.expectedSessionVersion }
  if (request.actor.kind === 'admin') content.booker = [request.booker.name, request.booker.phone]
  return createHash('sha256').update(JSON.stringify(content)).digest('hex')
}

export function toAdmittedBooking(booking: AdmittedBookingRow): AdmittedBooking {
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

type SessionQuote = NonNullable<Awaited<ReturnType<ReturnType<typeof createAdmissionRepository>['findSessionQuote']>>>

export function createAdmissionService(database: PrismaClient, clock = () => new Date()) {
  async function readQuote(transaction: Prisma.TransactionClient, sessionId: string, now: Date) {
    const repository = createAdmissionRepository(transaction)
    const session = await repository.findSessionQuote(sessionId)
    if (!session) throw new ApiError(404, 'NOT_FOUND')
    const occupied = await repository.occupiedPlaces(sessionId, now)
    return { session, occupied }
  }

  function toOptions(session: SessionQuote, occupied: number, now: Date): BookingOptionsResponse {
    const remainingPlaces = Math.max(0, session.maxParticipants - occupied)
    const bookingClosesAt = new Date(session.startsAt.getTime() - BOOKING_CUTOFF_MS)
    return {
      sessionId: session.id,
      sessionVersion: session.version,
      unitPriceIdr: session.priceIdr,
      remainingPlaces,
      bookingClosesAt: bookingClosesAt.toISOString(),
      serverNow: now.toISOString(),
      canReserve: session.status === 'scheduled' && now < bookingClosesAt && remainingPlaces > 0,
    }
  }

  async function getOptions(sessionId: string) {
    const now = clock()
    return inTransaction(database, async transaction => {
      const { session, occupied } = await readQuote(transaction, sessionId, now)
      return { options: toOptions(session, occupied, now), session }
    })
  }

  async function admit(request: AdmissionRequest): Promise<AdmittedBookingResponse> {
    const { input, actor } = request
    const names = normalizedNames(input)
    const digest = fingerprint(request, names)

    return inWriteTransaction(database, async transaction => {
      const repository = createAdmissionRepository(transaction)
      const locked = await repository.acquireSessionCapacityWrite(input.sessionId)
      if (!locked.count) throw new ApiError(404, 'NOT_FOUND')

      const prior = await repository.findByRequestId(actor.kind, actor.id, input.createRequestId)
      if (prior) {
        if (prior.fingerprint !== digest) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT')
        return { booking: toAdmittedBooking(prior), replayed: true, serverNow: clock().toISOString() }
      }

      // Fresh time on every attempt, so a retried transaction never admits with a clock read before it waited.
      const now = clock()
      const session = await repository.findSession(input.sessionId)
      if (!session) throw new ApiError(404, 'NOT_FOUND')
      const closesAt = session.startsAt.getTime() - BOOKING_CUTOFF_MS
      if (session.status !== 'scheduled' || now.getTime() >= closesAt) throw new ApiError(409, 'BOOKING_CLOSED')
      if (session.version !== input.expectedSessionVersion) throw new ApiError(409, 'SESSION_CHANGED')
      const total = session.priceIdr * input.quantity
      if (!Number.isSafeInteger(total) || total < 0) throw new ApiError(400, 'VALIDATION_FAILED', { quantity: 'OUT_OF_RANGE' })
      const occupied = await repository.occupiedPlaces(session.id, now)
      if (input.quantity > session.maxParticipants - occupied) throw new ApiError(409, 'CAPACITY_UNAVAILABLE')

      const booking = await repository.create({
        sessionId: session.id,
        customerId: request.customerId,
        actorKind: actor.kind,
        actorId: actor.id,
        createRequestId: input.createRequestId,
        fingerprint: digest,
        bookerName: request.booker.name,
        bookerPhone: request.booker.phone,
        quantity: input.quantity,
        unitPriceIdr: session.priceIdr,
        totalPriceIdr: total,
        originalDeadline: new Date(now.getTime() + RESERVATION_HOLD_MS),
      }, names)
      return { booking: toAdmittedBooking(booking), replayed: false, serverNow: now.toISOString() }
    })
  }

  return { getOptions, admit }
}

export type AdmissionService = ReturnType<typeof createAdmissionService>
