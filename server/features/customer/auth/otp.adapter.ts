import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

export interface OtpAdapter {
  request(challengeId: string, expiresAt: Date): { codeDigest: string; debugCode: string }
  available(challengeId: string, now: Date): boolean
  check(challengeId: string, code: string, codeDigest: string, now: Date): boolean
  forget(challengeId: string): void
  developmentCode(challengeId: string, now: Date): string | undefined
}

export function createMockOtpAdapter(): OtpAdapter {
  const secret = randomBytes(32)
  const codes = new Map<string, { code: string; expiresAt: Date }>()
  const digest = (code: string) => createHmac('sha256', secret).update(code).digest('hex')

  return {
    request(challengeId, expiresAt) {
      const now = new Date()
      for (const [id, entry] of codes) {
        if (entry.expiresAt <= now) codes.delete(id)
      }
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
      codes.set(challengeId, { code, expiresAt })
      const timer = setTimeout(() => codes.delete(challengeId), Math.max(0, expiresAt.getTime() - now.getTime()))
      timer.unref()
      return { codeDigest: digest(code), debugCode: code }
    },
    available(challengeId, now) {
      const entry = codes.get(challengeId)
      if (!entry || entry.expiresAt <= now) {
        codes.delete(challengeId)
        return false
      }
      return true
    },
    check(challengeId, code, codeDigest, now) {
      const entry = codes.get(challengeId)
      if (!entry || entry.expiresAt <= now) return false
      const expected = Buffer.from(codeDigest, 'hex')
      const supplied = Buffer.from(digest(code), 'hex')
      return expected.length === supplied.length && timingSafeEqual(expected, supplied)
    },
    forget(challengeId) {
      codes.delete(challengeId)
    },
    developmentCode(challengeId, now) {
      const entry = codes.get(challengeId)
      return entry && entry.expiresAt > now ? entry.code : undefined
    },
  }
}
