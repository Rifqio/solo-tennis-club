import type { Prisma } from '../generated/prisma/client.ts'
import type { Database } from '../database/transaction.ts'

export type SignInKeys = { emailKey: string; ipKey: string }

export function createAuthRepository(database: Database) {
  return {
    findAccountByEmail(email: string) {
      return database.adminAccount.findUnique({ where: { email } })
    },
    // Development sign-in only: the oldest active real admin, never the placeholder development admin.
    findFirstActiveAccount(excludeId: string) {
      return database.adminAccount.findFirst({ where: { isActive: true, id: { not: excludeId } }, orderBy: { createdAt: 'asc' } })
    },
    createAccount(data: Prisma.AdminAccountCreateInput) {
      return database.adminAccount.create({ data })
    },
    updateAccount(id: string, data: Prisma.AdminAccountUpdateInput) {
      return database.adminAccount.update({ where: { id }, data })
    },
    createSession(data: Prisma.AdminSessionUncheckedCreateInput) {
      return database.adminSession.create({ data })
    },
    findSessionByTokenHash(tokenHash: string) {
      return database.adminSession.findUnique({ where: { tokenHash }, include: { admin: true } })
    },
    updateLastSeen(id: string, lastSeenAt: Date) {
      return database.adminSession.update({ where: { id }, data: { lastSeenAt } })
    },
    revokeSession(id: string, revokedAt: Date) {
      return database.adminSession.update({ where: { id }, data: { revokedAt } })
    },
    revokeAllSessions(adminId: string, revokedAt: Date) {
      return database.adminSession.updateMany({ where: { adminId, revokedAt: null }, data: { revokedAt } })
    },
    findFailedAttempts(keys: SignInKeys, since: Date) {
      return database.loginAttempt.findMany({
        where: {
          succeeded: false,
          createdAt: { gt: since },
          OR: [{ emailKey: keys.emailKey }, { ipKey: keys.ipKey }],
        },
        select: { emailKey: true, ipKey: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      })
    },
    createAttempt(keys: SignInKeys, succeeded: boolean, createdAt: Date) {
      return database.loginAttempt.create({ data: { ...keys, succeeded, createdAt } })
    },
    deleteOldAttempts(keys: SignInKeys, before: Date) {
      return database.loginAttempt.deleteMany({
        where: {
          createdAt: { lt: before },
          OR: [{ emailKey: keys.emailKey }, { ipKey: keys.ipKey }],
        },
      })
    },
  }
}
