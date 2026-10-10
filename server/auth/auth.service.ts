import type { PrismaClient } from '../generated/prisma/client.ts'
import { ApiError } from '../http/errors.ts'
import { verifyPassword, verifyAgainstDummy } from './password.ts'
import { createAdminSession } from './session-store.ts'
import { checkSignInThrottle, recordSignInAttempt, signInKeys } from './throttle.ts'
import { DEVELOPMENT_ADMIN_ID } from './development-admin.ts'
import { createAuthRepository } from './auth.repository.ts'

type SignInInput = { email: string; password: string; ip: string }

export async function signInAdmin(database: PrismaClient, input: SignInInput) {
  const keys = signInKeys(input.email, input.ip)
  const throttle = await checkSignInThrottle(database, keys)
  if (throttle.throttled) {
    throw new ApiError(429, 'SIGN_IN_THROTTLED', undefined, undefined, throttle.retryAfterSeconds)
  }

  const account = await createAuthRepository(database).findAccountByEmail(input.email)
  let valid: boolean
  if (account?.isActive && account.id !== DEVELOPMENT_ADMIN_ID) {
    valid = await verifyPassword(input.password, account.passwordHash)
  } else {
    valid = await verifyAgainstDummy(input.password)
  }
  await recordSignInAttempt(database, keys, valid)
  if (!valid || !account) throw new ApiError(401, 'SIGN_IN_FAILED')

  const session = await createAdminSession(database, account.id)
  return {
    admin: { email: account.email, displayName: account.displayName },
    session,
  }
}

// Development servers only (the route is not mounted in production): sign in as the first active admin without a
// password, so local testing does not need credentials typed after every restart.
export async function signInDevelopmentAdmin(database: PrismaClient) {
  const account = await createAuthRepository(database).findFirstActiveAccount(DEVELOPMENT_ADMIN_ID)
  if (!account) throw new ApiError(404, 'NOT_FOUND')
  const session = await createAdminSession(database, account.id)
  return {
    admin: { email: account.email, displayName: account.displayName },
    session,
  }
}
