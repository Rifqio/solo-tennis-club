import type { Prisma } from '../../../generated/prisma/client.ts'
import type { Database } from '../../../database/transaction.ts'

export function createCustomerAuthRepository(database: Database) {
  return {
    findCustomerByPhone(phone: string) {
      return database.customer.findUnique({ where: { phone } })
    },
    ensureCustomer(phone: string, displayName: string, verifiedAt: Date) {
      return database.customer.upsert({
        where: { phone },
        create: { phone, displayName, verifiedAt },
        update: {},
      })
    },
    createSession(data: Prisma.CustomerSessionUncheckedCreateInput) {
      return database.customerSession.create({ data })
    },
    findSession(tokenHash: string) {
      return database.customerSession.findUnique({ where: { tokenHash }, include: { customer: true } })
    },
    revokeSession(id: string, revokedAt: Date) {
      return database.customerSession.update({ where: { id }, data: { revokedAt } })
    },
    createChallenge(data: Prisma.OtpChallengeCreateInput) {
      return database.otpChallenge.create({ data })
    },
    findChallenge(id: string) {
      return database.otpChallenge.findUnique({ where: { id } })
    },
    findPendingFlowChallenge(flowHash: string, now: Date) {
      return database.otpChallenge.findFirst({
        where: { flowHash, expiresAt: { gt: now }, consumedAt: null, supersededAt: null },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      })
    },
    findLatestPhoneChallenge(phone: string) {
      return database.otpChallenge.findFirst({ where: { phone }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
    },
    supersedeFlowChallenges(flowHash: string, now: Date) {
      return database.otpChallenge.updateMany({
        where: { flowHash, consumedAt: null, supersededAt: null },
        data: { supersededAt: now },
      })
    },
    incrementAttempts(id: string) {
      return database.otpChallenge.update({ where: { id }, data: { attempts: { increment: 1 } } })
    },
    consumeChallenge(id: string, data: Prisma.OtpChallengeUpdateInput) {
      return database.otpChallenge.update({ where: { id }, data })
    },
    findProfileProof(proofTokenHash: string) {
      return database.otpChallenge.findUnique({ where: { proofTokenHash } })
    },
    async claimProfileProof(proofTokenHash: string, flowHash: string, csrfToken: string, now: Date) {
      const claimed = await database.otpChallenge.updateMany({
        where: {
          proofTokenHash,
          flowHash,
          proofCsrfToken: csrfToken,
          verifiedAt: { not: null },
          profileExpiresAt: { gt: now },
          profileCompletedAt: null,
        },
        data: { profileCompletedAt: now },
      })
      return claimed.count === 1
    },
    createAttempt(phoneKey: string, ipKey: string, kind: 'request' | 'verify', createdAt: Date) {
      return database.otpAttempt.create({ data: { phoneKey, ipKey, kind, createdAt } })
    },
    countPhoneRequests(phoneKey: string, since: Date) {
      return database.otpAttempt.count({ where: { phoneKey, kind: 'request', createdAt: { gt: since } } })
    },
    countIpAttempts(ipKey: string, kind: 'request' | 'verify', since: Date) {
      return database.otpAttempt.count({ where: { ipKey, kind, createdAt: { gt: since } } })
    },
    async cleanExpiredRecords(before: Date) {
      await database.otpAttempt.deleteMany({ where: { createdAt: { lt: before } } })
      await database.otpChallenge.deleteMany({
        where: { expiresAt: { lt: before }, OR: [{ profileExpiresAt: null }, { profileExpiresAt: { lt: before } }] },
      })
      await database.customerSession.deleteMany({ where: { expiresAt: { lt: before } } })
    },
  }
}
