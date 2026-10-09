import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { Database } from '../../../database/transaction.ts'
import type { Customer } from '../../../generated/prisma/client.ts'
import type { CustomerSessionResponse } from '../../../../shared/api/customer-auth.ts'
import { ApiError } from '../../../http/errors.ts'
import { createCustomerAuthRepository } from './customer-auth.repository.ts'

export const randomToken = () => randomBytes(32).toString('base64url')
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
export const isOpaqueToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token)

export function requireMatchingCsrf(supplied: string, expected: string) {
  const suppliedBytes = Buffer.from(supplied)
  const expectedBytes = Buffer.from(expected)
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
    throw new ApiError(403, 'CSRF_FAILED')
  }
}

export async function issueCustomerSession(database: Database, customer: Customer, now: Date) {
  if (!customer.isActive) throw new ApiError(401, 'CUSTOMER_UNAUTHENTICATED')
  const token = randomToken()
  const csrfToken = randomToken()
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  await createCustomerAuthRepository(database).createSession({
    customerId: customer.id,
    tokenHash: hashToken(token),
    csrfToken,
    expiresAt,
  })
  const response: CustomerSessionResponse = {
    customer: { id: customer.id, displayName: customer.displayName, phone: customer.phone },
    csrfToken,
    expiresAt: expiresAt.toISOString(),
  }
  return { token, expiresAt, response }
}

export async function requireCustomerSession(database: Database, token: string, now: Date) {
  if (!isOpaqueToken(token)) throw new ApiError(401, 'CUSTOMER_UNAUTHENTICATED')
  const session = await createCustomerAuthRepository(database).findSession(hashToken(token))
  if (!session || session.revokedAt || session.expiresAt <= now || !session.customer.isActive) {
    throw new ApiError(401, 'CUSTOMER_UNAUTHENTICATED')
  }
  return session
}

export async function signOutCustomer(database: Database, token: string, csrfToken: string, now: Date) {
  const session = await requireCustomerSession(database, token, now)
  requireMatchingCsrf(csrfToken, session.csrfToken)
  await createCustomerAuthRepository(database).revokeSession(session.id, now)
}
