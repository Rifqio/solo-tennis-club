import { createHash } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { readRuntimeConfig } from '../../server/config/runtime-config.ts'
import { deactivateAdmin, provisionAdmin } from '../../server/auth/provisioning.ts'
import { parseCookies } from '../../server/auth/cookie.ts'
import { createAdminSession } from '../../server/auth/session-store.ts'
import { DEVELOPMENT_ADMIN_ID } from '../../server/auth/development-admin.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { provisionTestAdmin, signInAs, adminFetch } from '../support/admin-fixtures.ts'
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let credentials: Awaited<ReturnType<typeof provisionTestAdmin>>
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
beforeAll(async () => { db = await createTestDatabase(); credentials = await provisionTestAdmin(db.prisma); server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' })) })
beforeEach(async () => { await db.prisma.loginAttempt.deleteMany(); await db.prisma.adminSession.deleteMany(); await db.prisma.adminAccount.update({ where: { email: credentials.email }, data: { isActive: true } }) })
afterAll(async () => { await server?.close(); await db?.cleanup() })
const signIn = (email: string, password: string, headers: Record<string, string> = {}) => fetch(server.baseUrl + '/api/admin/auth/sign-in', { method: 'POST', headers: { Origin: server.baseUrl, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ email, password }) })
async function expectCode(response: Response, status: number, code: string) { expect(response.status).toBe(status); expect(await response.json()).toMatchObject({ error: { code } }) }
test('identical failure bodies for unknown email, wrong password and deactivated account; normalized email signs in', async () => {
  const unknown = await signIn('unknown@lafu.test', credentials.password)
  const wrong = await signIn(credentials.email, 'incorrect')
  await deactivateAdmin(db.prisma, credentials.email)
  const inactive = await signIn(credentials.email, credentials.password)
  for (const response of [unknown, wrong, inactive]) { expect(response.status).toBe(401); expect(await response.json()).toEqual({ error: { code: 'SIGN_IN_FAILED' } }) }
  await db.prisma.adminAccount.update({ where: { email: credentials.email }, data: { isActive: true } })
  expect((await signIn('  ' + credentials.email.toUpperCase() + '  ', credentials.password)).status).toBe(200)
})
test('throttling refuses the sixth email attempt even with the correct password', async () => {
  for (let i = 0; i < 5; i++) expect((await signIn(credentials.email, 'incorrect')).status).toBe(401)
  const response = await signIn(credentials.email, credentials.password)
  expect(response.status).toBe(429)
  expect(await response.json()).toMatchObject({ error: { code: 'SIGN_IN_THROTTLED', retryAfterSeconds: expect.any(Number) } })
  expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0)
})
test('address throttling blocks the 21st failure while an unrelated address is unaffected', async () => {
  await db.prisma.loginAttempt.createMany({ data: Array.from({ length: 20 }, (_, i) => ({ emailKey: digest('failed' + i + '@lafu.test'), ipKey: digest('127.0.0.1'), succeeded: false })) })
  await expectCode(await signIn(credentials.email, credentials.password), 429, 'SIGN_IN_THROTTLED')
  await db.prisma.loginAttempt.updateMany({ data: { ipKey: digest('another-address') } })
  expect((await signIn(credentials.email, credentials.password)).status).toBe(200)
})
test('old failures expire after 15 minutes and storage cleanup removes attempts older than 24 hours', async () => {
  await db.prisma.loginAttempt.createMany({ data: Array.from({ length: 5 }, () => ({ emailKey: digest(credentials.email), ipKey: digest('127.0.0.1'), succeeded: false, createdAt: new Date(Date.now() - 25 * 3600000) })) })
  expect((await signIn(credentials.email, credentials.password)).status).toBe(200)
  expect(await db.prisma.loginAttempt.count()).toBe(1)
})
test('denial matrix protects known and unknown admin paths, including anonymous and forged cookies', async () => {
  for (const [path, method] of [['/session-options', 'GET'], ['/auth/session', 'GET'], ['/sessions', 'POST'], ['/does-not-exist', 'GET']]) {
    await expectCode(await fetch(server.baseUrl + '/api/admin' + path, { method }), 401, 'UNAUTHENTICATED')
    await expectCode(await fetch(server.baseUrl + '/api/admin' + path, { method, headers: { Cookie: 'lafu_admin=forged' } }), 401, 'UNAUTHENTICATED')
  }
  for (const body of ['{broken', JSON.stringify({ payload: 'x'.repeat(33000) })]) {
    await expectCode(await fetch(server.baseUrl + '/api/admin/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }), 401, 'UNAUTHENTICATED')
  }
})
test('CSRF rejects missing and another session token; origin and content type are enforced', async () => {
  const auth = await signInAs(server.baseUrl, credentials), other = await signInAs(server.baseUrl, credentials)
  const mutate = (headers: Record<string, string>) => adminFetch(server.baseUrl, auth, '/sessions', { method: 'POST', body: '{}', headers })
  await expectCode(await mutate({ 'X-CSRF-Token': '' }), 403, 'CSRF_FAILED')
  await expectCode(await mutate({ 'X-CSRF-Token': other.csrfToken }), 403, 'CSRF_FAILED')
  await expectCode(await mutate({ Origin: 'http://evil.example' }), 403, 'ORIGIN_REJECTED')
  await expectCode(await mutate({ Origin: '' }), 403, 'ORIGIN_REJECTED')
  await expectCode(await mutate({ 'Content-Type': 'text/plain' }), 415, 'UNSUPPORTED_MEDIA_TYPE')
  await expectCode(await signIn(credentials.email, credentials.password, { Origin: 'http://evil.example' }), 403, 'ORIGIN_REJECTED')
  await expectCode(await adminFetch(server.baseUrl, auth, '/sessions', { method: 'POST', headers: { 'X-CSRF-Token': '' }, body: '{broken' }), 403, 'CSRF_FAILED')
})
test('sign-out revocation makes the old cookie unusable', async () => {
  const auth = await signInAs(server.baseUrl, credentials)
  const out = await adminFetch(server.baseUrl, auth, '/auth/sign-out', { method: 'POST', body: '{}' })
  expect(out.status).toBe(204); expect(out.headers.get('set-cookie')).toContain('Max-Age=0')
  await expectCode(await adminFetch(server.baseUrl, auth, '/auth/session'), 401, 'UNAUTHENTICATED')
})
test('expiry refuses the persisted session at its absolute deadline', async () => {
  const auth = await signInAs(server.baseUrl, credentials)
  await db.prisma.adminSession.updateMany({ data: { expiresAt: new Date(Date.now() - 1) } })
  await expectCode(await adminFetch(server.baseUrl, auth, '/auth/session'), 401, 'UNAUTHENTICATED')
})
test('deactivation refuses and revokes all existing sessions', async () => {
  const auth = await signInAs(server.baseUrl, credentials)
  await deactivateAdmin(db.prisma, credentials.email)
  await expectCode(await adminFetch(server.baseUrl, auth, '/auth/session'), 401, 'UNAUTHENTICATED')
  expect(await db.prisma.adminSession.count({ where: { revokedAt: null } })).toBe(0)
})
test('re-provision revocation rotates the hash and invalidates every old cookie', async () => {
  const auth = await signInAs(server.baseUrl, credentials)
  const before = await db.prisma.adminAccount.findUniqueOrThrow({ where: { email: credentials.email } })
  expect(await provisionAdmin(db.prisma, credentials)).toBe('updated')
  const after = await db.prisma.adminAccount.findUniqueOrThrow({ where: { email: credentials.email } })
  expect(after.passwordHash === before.passwordHash).toBe(false)
  await expectCode(await adminFetch(server.baseUrl, auth, '/auth/session'), 401, 'UNAUTHENTICATED')
})
test('cookie flags enforce HttpOnly SameSite Path and a 14-day absolute expiry; production defaults Secure', async () => {
  const auth = await signInAs(server.baseUrl, credentials)
  for (const flag of ['HttpOnly', 'SameSite=Lax', 'Path=/', 'Expires=']) expect(auth.setCookie).toContain(flag)
  expect(Math.abs(new Date(auth.info.expiresAt).getTime() - Date.now() - 14 * 86400000)).toBeLessThan(5000)
  const session = await db.prisma.adminSession.findFirstOrThrow()
  expect(session.tokenHash).toBe(digest(auth.cookie.split('=')[1]))
  expect(auth.cookie.includes(session.tokenHash)).toBe(false)
  const production = await startTestServer(createApp({ prisma: db.prisma }))
  try { expect((await signInAs(production.baseUrl, credentials)).setCookie).toContain('; Secure') } finally { await production.close() }
  expect(parseCookies('a=x=y; malformed; bad=%ZZ; good=hello%20world')).toEqual({ a: 'x=y', good: 'hello world' })
})
test('runtime config restricts the insecure-cookie override to loopback hosts', () => {
  const oldHost = process.env.LAFU_HOST, oldSecure = process.env.LAFU_COOKIE_SECURE
  try {
    process.env.LAFU_COOKIE_SECURE = 'false'; process.env.LAFU_HOST = '0.0.0.0'
    expect(readRuntimeConfig('production').cookieSecure).toBe(true)
    process.env.LAFU_HOST = '127.0.0.1'; expect(readRuntimeConfig('production').cookieSecure).toBe(false)
  } finally {
    if (oldHost === undefined) delete process.env.LAFU_HOST; else process.env.LAFU_HOST = oldHost
    if (oldSecure === undefined) delete process.env.LAFU_COOKIE_SECURE; else process.env.LAFU_COOKIE_SECURE = oldSecure
  }
})

const developmentSignIn = (origin = server.baseUrl) => fetch(server.baseUrl + '/api/admin/auth/dev-sign-in', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{}',
})
test('removed development shortcut cannot create accounts or sessions', async () => {
  await expectCode(await developmentSignIn(), 401, 'UNAUTHENTICATED')
  expect(await db.prisma.adminAccount.count({ where: { id: DEVELOPMENT_ADMIN_ID } })).toBe(0)
  expect(await db.prisma.adminSession.count()).toBe(0)
})
test('blank or partially empty credentials cannot authenticate in development', async () => {
  for (const [email, password] of [['', ''], [credentials.email, ''], ['', credentials.password]]) {
    await expectCode(await signIn(email, password), 401, 'SIGN_IN_FAILED')
  }
  expect(await db.prisma.adminSession.count()).toBe(0)
})
test('both modes reject legacy mock-account cookies and the mock password', async () => {
  await db.prisma.adminAccount.create({ data: { id: DEVELOPMENT_ADMIN_ID, email: 'manual-test@lafu.test', displayName: 'Legacy test admin', passwordHash: 'development-only-no-password', passwordUpdatedAt: new Date() } })
  const session = await createAdminSession(db.prisma, DEVELOPMENT_ADMIN_ID)
  const cookie = 'lafu_admin=' + session.token
  const production = await startTestServer(createApp({ prisma: db.prisma }))
  try {
    await expectCode(await fetch(production.baseUrl + '/api/admin/auth/dev-sign-in', {
      method: 'POST', headers: { Origin: production.baseUrl, 'Content-Type': 'application/json' }, body: '{}',
    }), 401, 'UNAUTHENTICATED')
    await expectCode(await signIn('manual-test@lafu.test', 'development-only-no-password'), 401, 'SIGN_IN_FAILED')
    for (const instance of [server, production]) {
      for (const path of ['/auth/session', '/sessions']) {
        await expectCode(await fetch(instance.baseUrl + '/api/admin' + path, { headers: { Cookie: cookie } }), 401, 'UNAUTHENTICATED')
      }
    }
  } finally { await production.close() }
})

test('configured development tunnel origin supports sign-in and CSRF-protected sign-out; other origins remain denied', async () => {
  const origin = 'https://phone-test.ngrok-free.app'
  const tunnel = await startTestServer(createApp({ prisma: db.prisma, mode: 'development', developmentOrigins: [origin] }))
  const headers = { Origin: origin, Host: 'phone-test.ngrok-free.app', 'X-Forwarded-Proto': 'https', 'Content-Type': 'application/json' }
  try {
    const response = await fetch(tunnel.baseUrl + '/api/admin/auth/sign-in', { method: 'POST', headers, body: JSON.stringify({ email: credentials.email, password: credentials.password }) })
    expect(response.status).toBe(200)
    const info = await response.json()
    const cookie = response.headers.get('set-cookie')!.split(';')[0]
    await expectCode(await fetch(tunnel.baseUrl + '/api/admin/auth/sign-out', {
      method: 'POST', headers: { ...headers, Cookie: cookie }, body: '{}',
    }), 403, 'CSRF_FAILED')
    expect((await fetch(tunnel.baseUrl + '/api/admin/auth/sign-out', {
      method: 'POST', headers: { ...headers, Cookie: cookie, 'X-CSRF-Token': info.csrfToken }, body: '{}',
    })).status).toBe(204)
    for (const unapproved of ['https://evil.example', 'https://other.ngrok-free.app', 'null', '']) {
      await expectCode(await fetch(tunnel.baseUrl + '/api/admin/auth/sign-in', {
        method: 'POST', headers: { ...headers, Origin: unapproved }, body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      }), 403, 'ORIGIN_REJECTED')
    }
  } finally { await tunnel.close() }
})

test('production ignores supplied development tunnel origins', async () => {
  const origin = 'https://phone-test.ngrok-free.app'
  const production = await startTestServer(createApp({ prisma: db.prisma, developmentOrigins: [origin] }))
  try {
    await expectCode(await fetch(production.baseUrl + '/api/admin/auth/sign-in', {
      method: 'POST', headers: { Origin: origin, Host: 'phone-test.ngrok-free.app', 'Content-Type': 'application/json' }, body: JSON.stringify(credentials),
    }), 403, 'ORIGIN_REJECTED')
  } finally { await production.close() }
})
