import { createHash, randomBytes } from 'node:crypto'
import type { PrismaClient } from '../generated/prisma/client.ts'
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')
export async function createAdminSession(prisma: PrismaClient, adminId: string, now = new Date()) {
  const token = randomBytes(32).toString('base64url'), csrfToken = randomBytes(32).toString('base64url')
  const expiresAt = new Date(now.getTime() + 14 * 86400000)
  await prisma.adminSession.create({ data: { adminId, tokenHash: tokenHash(token), csrfToken, expiresAt, lastSeenAt: now } })
  return { token, csrfToken, expiresAt }
}
export async function findValidAdminSession(prisma: PrismaClient, token: string, now = new Date()) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  const session = await prisma.adminSession.findUnique({ where: { tokenHash: tokenHash(token) }, include: { admin: true } })
  if (!session || session.revokedAt || session.expiresAt <= now || !session.admin.isActive) return null
  if (now.getTime() - session.lastSeenAt.getTime() >= 300000) await prisma.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: now } })
  return session
}
export async function revokeAdminSession(prisma: PrismaClient, id: string, now = new Date()) { await prisma.adminSession.update({ where: { id }, data: { revokedAt: now } }) }
export async function revokeAllAdminSessions(prisma: PrismaClient, adminId: string, now = new Date()) { await prisma.adminSession.updateMany({ where: { adminId, revokedAt: null }, data: { revokedAt: now } }) }
