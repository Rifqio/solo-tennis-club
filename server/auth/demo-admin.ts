import { randomBytes } from 'node:crypto'
import type { PrismaClient } from '../generated/prisma/client.ts'
import { hashPassword } from './password.ts'
import { createAuthRepository } from './auth.repository.ts'

// The hosted demo's admin. It is only ever signed in through the demo button, so its password is random and unknown.
export const DEMO_ADMIN_EMAIL = 'admin.demo@stc.example'
const DEMO_ADMIN_NAME = 'Admin demo'

export async function ensureDemoAdmin(database: PrismaClient) {
  const repository = createAuthRepository(database)
  const existing = await repository.findAccountByEmail(DEMO_ADMIN_EMAIL)
  if (existing?.isActive) return existing
  const data = { email: DEMO_ADMIN_EMAIL, displayName: DEMO_ADMIN_NAME, passwordHash: await hashPassword(randomBytes(24).toString('base64url')), passwordUpdatedAt: new Date(), isActive: true }
  return existing ? repository.updateAccount(existing.id, data) : repository.createAccount(data)
}
