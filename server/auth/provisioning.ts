import { z } from 'zod'
import type { PrismaClient } from '../generated/prisma/client.ts'
import { hashPassword } from './password.ts'
const accountInput = z.strictObject({ email: z.email().max(254), displayName: z.string().min(1).max(120), password: z.string().min(12).max(256) })
export async function provisionAdmin(prisma: PrismaClient, input: { email: string; displayName: string; password: string }): Promise<'created' | 'updated'> {
  const parsed = accountInput.safeParse({ ...input, email: input.email.trim().toLowerCase(), displayName: input.displayName.trim() })
  if (!parsed.success) throw new Error('Invalid administrator details: email, name, or password length')
  const passwordHash = await hashPassword(parsed.data.password)
  const now = new Date()
  return prisma.$transaction(async tx => {
    const existing = await tx.adminAccount.findUnique({ where: { email: parsed.data.email } })
    const data = { email: parsed.data.email, displayName: parsed.data.displayName, passwordHash, passwordUpdatedAt: now, isActive: true }
    if (!existing) { await tx.adminAccount.create({ data }); return 'created' }
    await tx.adminAccount.update({ where: { id: existing.id }, data })
    await tx.adminSession.updateMany({ where: { adminId: existing.id, revokedAt: null }, data: { revokedAt: now } })
    return 'updated'
  })
}
export async function deactivateAdmin(prisma: PrismaClient, email: string): Promise<void> {
  await prisma.$transaction(async tx => {
    const account = await tx.adminAccount.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (!account) throw new Error('Administrator not found')
    await tx.adminAccount.update({ where: { id: account.id }, data: { isActive: false } })
    await tx.adminSession.updateMany({ where: { adminId: account.id, revokedAt: null }, data: { revokedAt: new Date() } })
  })
}
