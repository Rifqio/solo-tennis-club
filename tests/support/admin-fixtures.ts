import { randomBytes, randomUUID } from 'node:crypto'
import type { PrismaClient } from '../../server/generated/prisma/client.ts'
import type { AdminSessionInfo } from '../../shared/api/admin-auth.ts'
import { provisionAdmin } from '../../server/auth/provisioning.ts'
export async function provisionTestAdmin(prisma: PrismaClient, overrides: Partial<{ email: string; password: string; displayName: string }> = {}) {
  const credentials = { email: randomUUID() + '@stc.test', password: randomBytes(18).toString('base64url'), displayName: 'Test administrator', ...overrides }
  await provisionAdmin(prisma, credentials)
  return credentials
}
export async function signInAs(baseUrl: string, credentials: { email: string; password: string }) {
  const response = await fetch(baseUrl + '/api/admin/auth/sign-in', { method: 'POST', headers: { Origin: baseUrl, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: credentials.email, password: credentials.password }) })
  if (!response.ok) throw new Error('Test sign-in failed: ' + response.status)
  const info = await response.json() as AdminSessionInfo
  return { cookie: response.headers.get('set-cookie')!.split(';')[0], csrfToken: info.csrfToken, info, setCookie: response.headers.get('set-cookie')! }
}
export function adminFetch(baseUrl: string, session: { cookie: string; csrfToken: string }, path: string, init: RequestInit = {}) {
  const headers = new Headers({ Cookie: session.cookie, Origin: baseUrl, 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken })
  new Headers(init.headers).forEach((value, key) => headers.set(key, value))
  return fetch(baseUrl + '/api/admin' + path, { ...init, headers })
}
