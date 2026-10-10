import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { inTransaction, inWriteTransaction } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import { normalizeCustomerPhone } from '../../../../shared/customer-rules.ts'
import type { AdminBookingDetailResponse, VerifiedCustomerLookupResponse } from '../../../../shared/api/admin-bookings.ts'
import { createAdminBookingRepository } from './booking.repository.ts'
import { getAdminBooking } from './booking.service.ts'

// Exact match only: an admin checks the number a booking was recorded with, never browses accounts.
export async function findVerifiedCustomer(database: PrismaClient, phoneInput: string): Promise<VerifiedCustomerLookupResponse> {
  const phone = normalizeCustomerPhone(phoneInput)
  if (!phone) throw new ApiError(400, 'VALIDATION_FAILED', { phone: 'INVALID_FORMAT' })
  return inTransaction(database, async transaction => {
    const customer = await createAdminBookingRepository(transaction).findVerifiedCustomerByPhone(phone)
    if (!customer) return { customer: null }
    return { customer: { id: customer.id, displayName: customer.displayName, phone: customer.phone, verifiedAt: customer.verifiedAt.toISOString() } }
  })
}

export type LinkCustomerInput = { bookingId: string; customerId: string; version: number; adminId: string }

// Gives an admin-recorded booking to the customer who verified the same phone. Ownership and version change; places,
// names, price and the original deadline do not. An owned booking is never moved to someone else here.
export async function linkBookingToCustomer(database: PrismaClient, input: LinkCustomerInput, clock = () => new Date()): Promise<AdminBookingDetailResponse> {
  return inWriteTransaction(database, async transaction => {
    const repository = createAdminBookingRepository(transaction)
    const booking = await repository.findLinkTarget(input.bookingId)
    if (!booking) throw new ApiError(404, 'NOT_FOUND')

    // A retry after a lost response finds its own link already in place.
    if (booking.customerId === input.customerId) return getAdminBooking(transaction, booking.id, clock())
    if (booking.customerId) throw new ApiError(409, 'BOOKING_ALREADY_LINKED', undefined, await getAdminBooking(transaction, booking.id, clock()))
    if (booking.version !== input.version) throw new ApiError(409, 'STALE_VERSION', undefined, await getAdminBooking(transaction, booking.id, clock()))

    const customer = await repository.findVerifiedCustomer(input.customerId)
    if (!customer) throw new ApiError(404, 'NOT_FOUND', { customerId: 'REFERENCE_NOT_FOUND' })
    if (customer.phone !== booking.bookerPhone) throw new ApiError(409, 'CUSTOMER_MISMATCH')

    const linked = await repository.linkIfUnownedAtVersion(booking.id, customer.id, input.version)
    if (!linked.count) throw new ApiError(409, 'STALE_VERSION', undefined, await getAdminBooking(transaction, booking.id, clock()))
    await repository.recordOwnershipEvent({ bookingId: booking.id, adminId: input.adminId, customerId: customer.id, bookingVersion: input.version + 1 })
    return getAdminBooking(transaction, booking.id, clock())
  })
}
