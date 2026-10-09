import { createHash, randomBytes } from 'node:crypto'
import type { Database } from '../database/transaction.ts'
import { createAuthRepository } from './auth.repository.ts'

const SESSION_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000
const LAST_SEEN_INTERVAL_MS = 5 * 60 * 1000

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createAdminSession(database: Database, adminId: string, now = new Date()) {
  const token = randomBytes(32).toString('base64url')
  const csrfToken = randomBytes(32).toString('base64url')
  const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS)
  await createAuthRepository(database).createSession({
    adminId,
    tokenHash: hashToken(token),
    csrfToken,
    expiresAt,
    lastSeenAt: now,
  })
  return { token, csrfToken, expiresAt }
}

export async function findValidAdminSession(database: Database, token: string, now = new Date()) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  const repository = createAuthRepository(database)
  const session = await repository.findSessionByTokenHash(hashToken(token))
  if (!session || session.revokedAt || session.expiresAt <= now || !session.admin.isActive) {
    return null
  }
  if (now.getTime() - session.lastSeenAt.getTime() >= LAST_SEEN_INTERVAL_MS) {
    await repository.updateLastSeen(session.id, now)
  }
  return session
}

export async function revokeAdminSession(database: Database, id: string, now = new Date()) {
  await createAuthRepository(database).revokeSession(id, now)
}

export async function revokeAllAdminSessions(database: Database, adminId: string, now = new Date()) {
  await createAuthRepository(database).revokeAllSessions(adminId, now)
}
