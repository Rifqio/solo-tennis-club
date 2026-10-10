import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { ApiError } from '../../../http/errors.ts'
import { clubDateOf, clubTimeOf } from '../../../../shared/club-time.ts'
import { normalizeCustomerName, normalizeCustomerPhone } from '../../../../shared/customer-rules.ts'
import type { AdminBookingOptionsResponse, AdminCreateBookingRequest } from '../../../../shared/api/admin-bookings.ts'
import type { FieldErrorCode } from '../../../../shared/api/errors.ts'
import { createAdmissionService } from '../../booking-admission/admission.service.ts'

// An admin records a booking someone made on WhatsApp or at the desk. It goes through the same admission as a
// customer booking, so the two can never together exceed a session's places.
export function createAdminBookingCreateService(database: PrismaClient, clock = () => new Date()) {
  const admission = createAdmissionService(database, clock)

  async function getOptions(sessionId: string): Promise<AdminBookingOptionsResponse> {
    const { options, session } = await admission.getOptions(sessionId)
    const endsAt = new Date(session.startsAt.getTime() + session.durationMinutes * 60_000)
    return {
      ...options,
      session: {
        id: session.id,
        className: session.class.name,
        levelName: session.level.name,
        venueName: session.venue.name,
        date: clubDateOf(session.startsAt),
        startTime: clubTimeOf(session.startsAt),
        endTime: clubTimeOf(endsAt),
        startsAt: session.startsAt.toISOString(),
        cancelled: session.status !== 'scheduled',
      },
    }
  }

  function readContact(input: AdminCreateBookingRequest) {
    const fields: Record<string, FieldErrorCode> = {}
    const name = normalizeCustomerName(input.bookerName)
    if (!input.bookerName.trim()) fields.bookerName = 'REQUIRED'
    else if (!name) fields.bookerName = 'INVALID_FORMAT'
    const phone = normalizeCustomerPhone(input.bookerPhone)
    if (!input.bookerPhone.trim()) fields.bookerPhone = 'REQUIRED'
    else if (!phone) fields.bookerPhone = 'INVALID_FORMAT'
    if (!name || !phone) throw new ApiError(400, 'VALIDATION_FAILED', fields)
    return { name, phone }
  }

  // The phone is stored in the same normalized form customers sign in with, so a later link can compare exactly.
  // The booking stays unowned: an admin-typed number is a contact, not a verified identity.
  function create(adminId: string, input: AdminCreateBookingRequest) {
    const booker = readContact(input)
    return admission.admit({
      actor: { kind: 'admin', id: adminId },
      customerId: null,
      booker,
      input: {
        sessionId: input.sessionId,
        quantity: input.quantity,
        participantNames: input.participantNames,
        expectedSessionVersion: input.expectedSessionVersion,
        createRequestId: input.createRequestId,
      },
    })
  }

  return { getOptions, create }
}

export type AdminBookingCreateService = ReturnType<typeof createAdminBookingCreateService>
