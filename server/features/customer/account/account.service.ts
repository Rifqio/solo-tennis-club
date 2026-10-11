import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { inWriteTransaction } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import { normalizeCustomerName, normalizeCustomerPhone } from '../../../../shared/customer-rules.ts'
import type { CustomerAccountResponse, CustomerPhoneChallengeResponse } from '../../../../shared/api/customer-account.ts'
import { createCustomerAuthRepository } from '../auth/customer-auth.repository.ts'
import type { CustomerAuthService } from '../auth/customer-auth.service.ts'
import { hashToken } from '../auth/customer-session.service.ts'
import type { OtpAdapter } from '../auth/otp.adapter.ts'
import { createAccountRepository } from './account.repository.ts'

const HOUR_MS = 60 * 60 * 1000

// The phone-change flow belongs to one signed-in session, so a code sent from it can only be confirmed by it.
export const phoneChangeFlow = (sessionId: string) => `phone-change:${sessionId}`

export function createAccountService(database: PrismaClient, auth: CustomerAuthService, adapter: OtpAdapter, clock = () => new Date()) {
  async function readAccount(customerId: string): Promise<CustomerAccountResponse> {
    const now = clock()
    const repository = createAccountRepository(database)
    const [customer, sessionsPlayed, activeBookings] = await Promise.all([
      repository.findCustomer(customerId), repository.countSessionsPlayed(customerId, now), repository.countActiveBookings(customerId, now),
    ])
    if (!customer) throw new ApiError(401, 'CUSTOMER_UNAUTHENTICATED')
    return {
      customer: { displayName: customer.displayName, phone: customer.phone, verifiedAt: customer.verifiedAt.toISOString() },
      stats: { sessionsPlayed, activeBookings },
    }
  }

  async function rename(customerId: string, input: string) {
    const name = normalizeCustomerName(input)
    if (!name) throw new ApiError(400, 'VALIDATION_FAILED', { displayName: 'INVALID_FORMAT' })
    await createAccountRepository(database).updateName(customerId, name)
    return readAccount(customerId)
  }

  // Sends a code to the new number through the sign-in limits (per number, per address, resend interval).
  async function requestPhoneChange(customer: { id: string; phone: string }, sessionId: string, input: string, ip: string): Promise<CustomerPhoneChallengeResponse> {
    const phone = normalizeCustomerPhone(input)
    if (!phone) throw new ApiError(400, 'VALIDATION_FAILED', { phone: 'INVALID_FORMAT' })
    if (phone === customer.phone) throw new ApiError(400, 'VALIDATION_FAILED', { phone: 'SAME_PHONE' })
    return auth.requestCode(phone, ip, phoneChangeFlow(sessionId))
  }

  // Confirms the new number with its code, then moves the account to it. The checks match sign-in's verifyCode, and
  // failed attempts are committed before their error is thrown, so the attempt limits hold.
  async function confirmPhoneChange(customerId: string, sessionId: string, challengeId: string, code: string, ip: string) {
    const outcome = await inWriteTransaction(database, async transaction => {
      const now = clock()
      const auth = createCustomerAuthRepository(transaction)
      await auth.createAttempt(hashToken(challengeId), hashToken(ip), 'verify', now)
      const ipAttempts = await auth.countIpAttempts(hashToken(ip), 'verify', new Date(now.getTime() - HOUR_MS))
      if (ipAttempts > 100) throw new ApiError(429, 'OTP_THROTTLED', undefined, undefined, 3600)

      const challenge = await auth.findChallenge(challengeId)
      if (!challenge || challenge.flowHash !== hashToken(phoneChangeFlow(sessionId))) return new ApiError(400, 'OTP_INVALID')
      if (challenge.consumedAt || challenge.supersededAt) return new ApiError(409, 'OTP_CONSUMED')
      if (challenge.expiresAt <= now || !adapter.available(challengeId, now)) return new ApiError(400, 'OTP_EXPIRED')
      if (challenge.attempts >= 5) {
        return new ApiError(429, 'OTP_THROTTLED', undefined, undefined, Math.ceil((challenge.expiresAt.getTime() - now.getTime()) / 1000))
      }
      await auth.incrementAttempts(challengeId)
      if (!adapter.check(challengeId, code, challenge.codeDigest, now)) return new ApiError(400, 'OTP_INVALID')

      // The new number is proven theirs; only now can we say it already belongs to another account.
      const holder = await auth.findCustomerByPhone(challenge.phone)
      await auth.consumeChallenge(challengeId, { consumedAt: now, verifiedAt: now })
      if (holder && holder.id !== customerId) return new ApiError(409, 'VALIDATION_FAILED', { phone: 'PHONE_IN_USE' })
      await createAccountRepository(transaction).updatePhone(customerId, challenge.phone, now)
      return null
    })
    if (outcome instanceof ApiError) throw outcome
    adapter.forget(challengeId)
    return readAccount(customerId)
  }

  return { readAccount, rename, requestPhoneChange, confirmPhoneChange }
}

export type AccountService = ReturnType<typeof createAccountService>
