import { randomUUID } from 'node:crypto'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { inWriteTransaction } from '../../../database/transaction.ts'
import { ApiError } from '../../../http/errors.ts'
import { normalizeCustomerName, normalizeCustomerPhone } from '../../../../shared/customer-rules.ts'
import type { OtpChallengeResponse } from '../../../../shared/api/customer-auth.ts'
import { createCustomerAuthRepository } from './customer-auth.repository.ts'
import type { OtpAdapter } from './otp.adapter.ts'
import { hashToken, issueCustomerSession, randomToken, requireMatchingCsrf } from './customer-session.service.ts'

const HOUR_MS = 60 * 60 * 1000
const CODE_LIFETIME_MS = 5 * 60 * 1000
const PROFILE_LIFETIME_MS = 10 * 60 * 1000
const RESEND_INTERVAL_MS = 30 * 1000

export function createCustomerAuthService(database: PrismaClient, adapter: OtpAdapter, clock = () => new Date()) {
  async function requestCode(phoneInput: string, ip: string, flowToken: string) {
    const phone = normalizeCustomerPhone(phoneInput)
    if (!phone) throw new ApiError(400, 'VALIDATION_FAILED', { phone: 'INVALID_FORMAT' })

    const now = clock()
    const challengeId = randomUUID()
    const expiresAt = new Date(now.getTime() + CODE_LIFETIME_MS)
    const resendAt = new Date(now.getTime() + RESEND_INTERVAL_MS)
    const delivery = adapter.request(challengeId, expiresAt)
    const phoneKey = hashToken(phone)
    const ipKey = hashToken(ip)

    try {
      await inWriteTransaction(database, async transaction => {
        const admittedAt = clock()
        const repository = createCustomerAuthRepository(transaction)
        // Acquire write ownership before reading limits, including across independent SQLite clients.
        await repository.createAttempt(phoneKey, ipKey, 'request', admittedAt)
        const since = new Date(admittedAt.getTime() - HOUR_MS)
        const phoneRequests = await repository.countPhoneRequests(phoneKey, since)
        const ipRequests = await repository.countIpAttempts(ipKey, 'request', since)
        if (phoneRequests > 5 || ipRequests > 20) {
          throw new ApiError(429, 'OTP_THROTTLED', undefined, undefined, 3600)
        }
        const previous = await repository.findLatestPhoneChallenge(phone)
        if (previous && adapter.available(previous.id, admittedAt) && previous.resendAt > admittedAt) {
          const retryAfter = Math.ceil((previous.resendAt.getTime() - admittedAt.getTime()) / 1000)
          throw new ApiError(429, 'OTP_THROTTLED', undefined, undefined, retryAfter)
        }
        const flowHash = hashToken(flowToken)
        await repository.supersedeFlowChallenges(flowHash, now)
        await repository.createChallenge({
          id: challengeId,
          phone,
          flowHash,
          codeDigest: delivery.codeDigest,
          expiresAt,
          resendAt,
          createdAt: now,
        })
        await repository.cleanExpiredRecords(new Date(now.getTime() - 24 * HOUR_MS))
      })
    } catch (error) {
      adapter.forget(challengeId)
      throw error
    }

    const response: OtpChallengeResponse = {
      challengeId,
      maskedPhone: phone.slice(0, 3) + ' •••• ' + phone.slice(-4),
      expiresAt: expiresAt.toISOString(),
      resendAt: resendAt.toISOString(),
      serverNow: clock().toISOString(),
      development: true,
      debugCode: delivery.debugCode,
    }
    return response
  }

  async function verifyCode(challengeId: string, code: string, ip: string, flowToken: string) {
    const outcome = await inWriteTransaction(database, async transaction => {
      const now = clock()
      const repository = createCustomerAuthRepository(transaction)
      await repository.createAttempt(hashToken(challengeId), hashToken(ip), 'verify', now)
      const ipAttempts = await repository.countIpAttempts(hashToken(ip), 'verify', new Date(now.getTime() - HOUR_MS))
      if (ipAttempts > 100) throw new ApiError(429, 'OTP_THROTTLED', undefined, undefined, 3600)

      const challenge = await repository.findChallenge(challengeId)
      if (!challenge || challenge.flowHash !== hashToken(flowToken)) return new ApiError(400, 'OTP_INVALID')
      if (challenge.consumedAt || challenge.supersededAt) return new ApiError(409, 'OTP_CONSUMED')
      if (challenge.expiresAt <= now || !adapter.available(challengeId, now)) return new ApiError(400, 'OTP_EXPIRED')
      if (challenge.attempts >= 5) {
        return new ApiError(429, 'OTP_THROTTLED', undefined, undefined, Math.ceil((challenge.expiresAt.getTime() - now.getTime()) / 1000))
      }
      await repository.incrementAttempts(challengeId)
      if (!adapter.check(challengeId, code, challenge.codeDigest, now)) {
        return new ApiError(400, 'OTP_INVALID')
      }

      const customer = await repository.findCustomerByPhone(challenge.phone)
      if (customer) {
        if (!customer.isActive) return new ApiError(401, 'CUSTOMER_UNAUTHENTICATED')
        const session = await issueCustomerSession(transaction, customer, now)
        await repository.consumeChallenge(challengeId, { consumedAt: now, verifiedAt: now })
        return { next: 'complete' as const, session }
      }

      const proofToken = randomToken()
      const csrfToken = randomToken()
      const expiresAt = new Date(now.getTime() + PROFILE_LIFETIME_MS)
      await repository.consumeChallenge(challengeId, {
        consumedAt: now,
        verifiedAt: now,
        proofTokenHash: hashToken(proofToken),
        proofCsrfToken: csrfToken,
        profileExpiresAt: expiresAt,
      })
      return { next: 'name' as const, proofToken, csrfToken, expiresAt }
    })

    // Invalid checks commit the attempt counter before exposing their error.
    if (outcome instanceof ApiError) throw outcome
    adapter.forget(challengeId)
    return outcome
  }

  async function readProfile(proofToken: string, flowToken: string) {
    const proof = await createCustomerAuthRepository(database).findProfileProof(hashToken(proofToken))
    if (!proof || proof.flowHash !== hashToken(flowToken) || !proof.verifiedAt || !proof.profileExpiresAt
      || proof.profileExpiresAt <= clock() || proof.profileCompletedAt || !proof.proofCsrfToken) {
      throw new ApiError(401, 'CUSTOMER_UNAUTHENTICATED')
    }
    return { next: 'name' as const, csrfToken: proof.proofCsrfToken, expiresAt: proof.profileExpiresAt.toISOString() }
  }

  async function completeProfile(nameInput: string, proofToken: string, flowToken: string, csrfToken: string) {
    const name = normalizeCustomerName(nameInput)
    if (!name) throw new ApiError(400, 'VALIDATION_FAILED', { name: 'INVALID_FORMAT' })
    return inWriteTransaction(database, async transaction => {
      const now = clock()
      const repository = createCustomerAuthRepository(transaction)
      // The conditional first write consumes the proof exactly once and serializes unique-phone creation.
      const claimed = await repository.claimProfileProof(hashToken(proofToken), hashToken(flowToken), csrfToken, now)
      const proof = await repository.findProfileProof(hashToken(proofToken))
      if (!claimed || !proof?.verifiedAt) {
        if (proof && proof.flowHash === hashToken(flowToken) && proof.profileExpiresAt && proof.profileExpiresAt > now && !proof.profileCompletedAt) {
          requireMatchingCsrf(csrfToken, proof.proofCsrfToken ?? '')
        }
        throw new ApiError(401, 'CUSTOMER_UNAUTHENTICATED')
      }
      const customer = await repository.ensureCustomer(proof.phone, name, proof.verifiedAt)
      return issueCustomerSession(transaction, customer, now)
    })
  }

  async function readPendingChallenge(flowToken: string): Promise<OtpChallengeResponse> {
    const now = clock()
    const challenge = await createCustomerAuthRepository(database).findPendingFlowChallenge(hashToken(flowToken), now)
    const debugCode = challenge ? adapter.developmentCode(challenge.id, now) : undefined
    if (!challenge || !debugCode) throw new ApiError(404, 'NOT_FOUND')
    return {
      challengeId: challenge.id,
      maskedPhone: challenge.phone.slice(0, 3) + ' •••• ' + challenge.phone.slice(-4),
      expiresAt: challenge.expiresAt.toISOString(),
      resendAt: challenge.resendAt.toISOString(),
      serverNow: now.toISOString(),
      development: true,
      debugCode,
    }
  }

  async function resendCode(challengeId: string, ip: string, flowToken: string) {
    const challenge = await createCustomerAuthRepository(database).findChallenge(challengeId)
    if (!challenge || challenge.flowHash !== hashToken(flowToken)) throw new ApiError(400, 'OTP_INVALID')
    return requestCode(challenge.phone, ip, flowToken)
  }

  return { requestCode, resendCode, verifyCode, readProfile, completeProfile, readPendingChallenge }
}

export type CustomerAuthService = ReturnType<typeof createCustomerAuthService>
