import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { createAdmissionService } from '../../booking-admission/admission.service.ts'
import type { AdmissionInput } from '../../booking-admission/admission.service.ts'

export type ReservationInput = AdmissionInput

// A signed-in customer books for themselves: the booking is theirs and carries their verified name and phone.
export function createCustomerBookingService(database: PrismaClient, clock = () => new Date()) {
  const admission = createAdmissionService(database, clock)

  async function getOptions(sessionId: string) {
    const { options } = await admission.getOptions(sessionId)
    return options
  }

  function reserve(customer: { id: string; displayName: string; phone: string }, input: ReservationInput) {
    return admission.admit({
      actor: { kind: 'customer', id: customer.id },
      customerId: customer.id,
      booker: { name: customer.displayName, phone: customer.phone },
      input,
    })
  }

  return { getOptions, reserve }
}

export type CustomerBookingService = ReturnType<typeof createCustomerBookingService>
