import { createHash } from 'node:crypto'
import type { PrismaClient } from '../generated/prisma/client.ts'
import { inTransaction } from '../database/transaction.ts'
import { createAuthRepository, type SignInKeys } from './auth.repository.ts'

const THROTTLE_WINDOW_MS = 15 * 60 * 1000
const ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000
const EMAIL_ATTEMPT_LIMIT = 5
const IP_ATTEMPT_LIMIT = 20

export function signInKeys(email: string, ip: string): SignInKeys {
  const digest = (value: string) => createHash('sha256').update(value).digest('hex')
  return { emailKey: digest(email.trim().toLowerCase()), ipKey: digest(ip) }
}

export async function checkSignInThrottle(database: PrismaClient, keys: SignInKeys, now = new Date()) {
  const since = new Date(now.getTime() - THROTTLE_WINDOW_MS)
  const attempts = await createAuthRepository(database).findFailedAttempts(keys, since)
  const emailAttempts = attempts.filter(attempt => attempt.emailKey === keys.emailKey)
  const ipAttempts = attempts.filter(attempt => attempt.ipKey === keys.ipKey)
  const emailUnlockAt = emailAttempts.length >= EMAIL_ATTEMPT_LIMIT
    ? emailAttempts[emailAttempts.length - EMAIL_ATTEMPT_LIMIT].createdAt.getTime() + THROTTLE_WINDOW_MS
    : 0
  const ipUnlockAt = ipAttempts.length >= IP_ATTEMPT_LIMIT
    ? ipAttempts[ipAttempts.length - IP_ATTEMPT_LIMIT].createdAt.getTime() + THROTTLE_WINDOW_MS
    : 0
  const unlockAt = Math.max(emailUnlockAt, ipUnlockAt)
  return {
    throttled: unlockAt > now.getTime(),
    retryAfterSeconds: Math.max(0, Math.ceil((unlockAt - now.getTime()) / 1000)),
  }
}

export async function recordSignInAttempt(database: PrismaClient, keys: SignInKeys, succeeded: boolean, now = new Date()) {
  await inTransaction(database, async transaction => {
    const repository = createAuthRepository(transaction)
    await repository.createAttempt(keys, succeeded, now)
    await repository.deleteOldAttempts(keys, new Date(now.getTime() - ATTEMPT_RETENTION_MS))
  })
}
