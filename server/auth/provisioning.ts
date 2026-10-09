import { z } from 'zod'
import type { PrismaClient } from '../generated/prisma/client.ts'
import { inTransaction } from '../database/transaction.ts'
import { hashPassword } from './password.ts'
import { createAuthRepository } from './auth.repository.ts'

const accountInput = z.strictObject({
  email: z.email().max(254),
  displayName: z.string().min(1).max(120),
  password: z.string().min(12).max(256),
})

export async function provisionAdmin(
  database: PrismaClient,
  input: { email: string; displayName: string; password: string },
): Promise<'created' | 'updated'> {
  const parsed = accountInput.safeParse({
    ...input,
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName.trim(),
  })
  if (!parsed.success) throw new Error('Invalid administrator details: email, name, or password length')

  const passwordHash = await hashPassword(parsed.data.password)
  const now = new Date()
  return inTransaction(database, async transaction => {
    const repository = createAuthRepository(transaction)
    const existing = await repository.findAccountByEmail(parsed.data.email)
    const data = {
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      passwordHash,
      passwordUpdatedAt: now,
      isActive: true,
    }
    if (!existing) {
      await repository.createAccount(data)
      return 'created'
    }
    await repository.updateAccount(existing.id, data)
    await repository.revokeAllSessions(existing.id, now)
    return 'updated'
  })
}

export async function deactivateAdmin(database: PrismaClient, email: string): Promise<void> {
  await inTransaction(database, async transaction => {
    const repository = createAuthRepository(transaction)
    const account = await repository.findAccountByEmail(email.trim().toLowerCase())
    if (!account) throw new Error('Administrator not found')
    await repository.updateAccount(account.id, { isActive: false })
    await repository.revokeAllSessions(account.id, new Date())
  })
}
