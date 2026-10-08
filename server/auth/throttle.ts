import { createHash } from 'node:crypto'
import type { PrismaClient } from '../generated/prisma/client.ts'
export function signInKeys(email: string, ip: string) {
  const digest = (value: string) => createHash('sha256').update(value).digest('hex')
  return { emailKey: digest(email.trim().toLowerCase()), ipKey: digest(ip) }
}
export async function checkSignInThrottle(prisma: PrismaClient, keys: { emailKey: string; ipKey: string }, now = new Date()) {
  const attempts = await prisma.loginAttempt.findMany({ where: { succeeded: false, createdAt: { gt: new Date(now.getTime() - 900000) }, OR: [{ emailKey: keys.emailKey }, { ipKey: keys.ipKey }] }, select: { emailKey: true, ipKey: true, createdAt: true }, orderBy: { createdAt: 'asc' } })
  const email = attempts.filter(row => row.emailKey === keys.emailKey), ip = attempts.filter(row => row.ipKey === keys.ipKey)
  const unlockAt = Math.max(email.length >= 5 ? email[email.length - 5].createdAt.getTime() + 900000 : 0, ip.length >= 20 ? ip[ip.length - 20].createdAt.getTime() + 900000 : 0)
  return { throttled: unlockAt > now.getTime(), retryAfterSeconds: Math.max(0, Math.ceil((unlockAt - now.getTime()) / 1000)) }
}
export async function recordSignInAttempt(prisma: PrismaClient, keys: { emailKey: string; ipKey: string }, succeeded: boolean, now = new Date()) {
  await prisma.$transaction(async tx => {
    await tx.loginAttempt.create({ data: { ...keys, succeeded, createdAt: now } })
    await tx.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 86400000) }, OR: [{ emailKey: keys.emailKey }, { ipKey: keys.ipKey }] } })
  })
}
