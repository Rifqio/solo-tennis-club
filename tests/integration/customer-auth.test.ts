import { afterAll, beforeAll, expect, test, vi } from 'vitest'
import { createApp } from '../../server/app.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createCustomerAuthService } from '../../server/features/customer/auth/customer-auth.service.ts'
import { createMockOtpAdapter } from '../../server/features/customer/auth/otp.adapter.ts'
import { randomToken, requireCustomerSession, hashToken } from '../../server/features/customer/auth/customer-session.service.ts'
import { readRuntimeConfig } from '../../server/config/runtime-config.ts'
import type { OtpChallengeResponse, CustomerSessionResponse } from '../../shared/api/customer-auth.ts'
import { provisionTestAdmin, signInAs } from '../support/admin-fixtures.ts'
import { backupDatabase, restoreDatabase } from '../../server/ops/backup.ts'
import { createPrismaClient, initializeDatabase } from '../../server/db.ts'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let phoneIndex = 1000
const phone = () => '+628123456' + String(phoneIndex++)

beforeAll(async () => {
  db = await createTestDatabase()
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' }))
})
afterAll(async () => {
  await server?.close()
  await db?.cleanup()
})

function cookieHeader(response: Response) {
  return response.headers.getSetCookie().filter(cookie => !cookie.includes('Max-Age=0')).map(cookie => cookie.split(';')[0]).join('; ')
}
function send(path: string, body: unknown, cookie = '', csrfToken = '', overrides: Record<string, string> = {}) {
  return fetch(server.baseUrl + '/api/customer/auth/' + path, {
    method: 'POST',
    headers: { Origin: server.baseUrl, 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrfToken, ...overrides },
    body: JSON.stringify(body),
  })
}

async function registerCustomer() {
  const request = await send('otp-challenges', { phone: phone() })
  expect(request.status).toBe(201)
  const challenge = await request.json() as OtpChallengeResponse
  const flowCookie = cookieHeader(request)
  const verified = await send('otp-verifications', { challengeId: challenge.challengeId, code: challenge.debugCode }, flowCookie)
  expect(verified.status).toBe(200)
  const proof = await verified.json() as { next: string; csrfToken: string }
  expect(proof.next).toBe('name')
  const profileCookie = flowCookie + '; ' + cookieHeader(verified)
  const completed = await send('profile', { name: 'Contoh Pelanggan' }, profileCookie, proof.csrfToken)
  expect(completed.status).toBe(201)
  return { info: await completed.json() as CustomerSessionResponse, cookie: cookieHeader(completed), challenge, flowCookie, profileCookie, proof }
}

test('new phone requires code and one-use name completion, then persists a private session and revocable sign-out', async () => {
  const customer = await registerCustomer()
  const response = await fetch(server.baseUrl + '/api/customer/auth/session', { headers: { Cookie: customer.cookie } })
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  expect(await response.json()).toEqual(customer.info)
  expect(response.headers.get('Set-Cookie')).toBeNull()
  expect(customer.cookie).toMatch(/^stc_customer=/)
  const stored = await db.prisma.customerSession.findFirstOrThrow({ where: { customerId: customer.info.customer.id } })
  expect(stored.tokenHash).not.toContain(customer.cookie.split('=')[1])
  expect((await send('profile', { name: 'Changed' }, customer.profileCookie, customer.proof.csrfToken)).status).toBe(401)
  expect((await send('sign-out', {}, customer.cookie, 'wrong')).status).toBe(403)
  expect((await send('sign-out', {}, customer.cookie, customer.info.csrfToken)).status).toBe(204)
  expect((await fetch(server.baseUrl + '/api/customer/auth/session', { headers: { Cookie: customer.cookie } })).status).toBe(401)
})

test('returning verified customer signs in directly without changing their name or creating another identity', async () => {
  const customer = await registerCustomer()
  const request = await send('otp-challenges', { phone: customer.info.customer.phone })
  const challenge = await request.json() as OtpChallengeResponse
  const verified = await send('otp-verifications', { challengeId: challenge.challengeId, code: challenge.debugCode }, cookieHeader(request))
  expect(verified.status).toBe(200)
  expect(await verified.json()).toMatchObject({ next: 'complete', session: { customer: customer.info.customer } })
  expect(await db.prisma.customer.count({ where: { phone: customer.info.customer.phone } })).toBe(1)
})

test('strict JSON/origin/CSRF input boundaries reject tampering and account enumeration fields', async () => {
  expect((await send('otp-challenges', { phone: phone() }, '', '', { Origin: 'https://foreign.test' })).status).toBe(403)
  expect((await send('otp-challenges', { phone: phone() }, '', '', { 'Content-Type': 'text/plain' })).status).toBe(415)
  expect((await send('otp-challenges', { phone: 'invalid' })).status).toBe(400)
  expect((await send('otp-challenges', { phone: phone(), customerId: 'forged' })).status).toBe(400)
  const response = await send('otp-challenges', { phone: phone() })
  expect(response.headers.get('Set-Cookie')).toContain('HttpOnly; SameSite=Lax; Path=/api/customer')
  const body = await response.json()
  expect(body.debugCode).toMatch(/^\d{6}$/)
  expect(body.development).toBe(true)
  expect(body).not.toHaveProperty('customer')
  expect(body).not.toHaveProperty('exists')
})

test('challenges bind to their flow cookie; reload resumes pending code/name without browser storage', async () => {
  const request = await send('otp-challenges', { phone: phone() })
  const challenge = await request.json() as OtpChallengeResponse
  const flowCookie = cookieHeader(request)
  expect((await send('otp-verifications', { challengeId: challenge.challengeId, code: challenge.debugCode })).status).toBe(400)
  expect((await fetch(server.baseUrl + '/api/customer/auth/otp-challenges/current')).status).toBe(404)
  const recovered = await fetch(server.baseUrl + '/api/customer/auth/otp-challenges/current', { headers: { Cookie: flowCookie } })
  expect(await recovered.json()).toMatchObject({ challengeId: challenge.challengeId, debugCode: challenge.debugCode })
  const verified = await send('otp-verifications', { challengeId: challenge.challengeId, code: challenge.debugCode }, flowCookie)
  const proof = await verified.json()
  const profileCookie = flowCookie + '; ' + cookieHeader(verified)
  const profile = await fetch(server.baseUrl + '/api/customer/auth/profile', { headers: { Cookie: profileCookie } })
  expect(await profile.json()).toMatchObject({ next: 'name', csrfToken: proof.csrfToken })
  expect((await send('profile', { name: 'Test' }, profileCookie, 'forged')).status).toBe(403)
  expect(await db.prisma.customer.findUnique({ where: { phone: (await db.prisma.otpChallenge.findUniqueOrThrow({ where: { id: challenge.challengeId } })).phone } })).toBeNull()
})

test('customer and admin cookies cannot authorize the other role; public endpoints expose no private identity', async () => {
  const customer = await registerCustomer()
  expect((await fetch(server.baseUrl + '/api/admin/sessions', { headers: { Cookie: customer.cookie } })).status).toBe(401)
  const admin = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma))
  expect((await fetch(server.baseUrl + '/api/customer/auth/session', { headers: { Cookie: admin.cookie } })).status).toBe(401)
  const publicResponse = await fetch(server.baseUrl + '/api/public/schedule?date=' + new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }))
  const publicBody = JSON.stringify(await publicResponse.json())
  expect(publicBody).not.toContain(customer.info.customer.phone)
  expect(publicBody).not.toContain(customer.info.csrfToken)
})

test('mock driver is rejected in production and disabled routes never disclose a development code', async () => {
  vi.stubEnv('STC_OTP_DRIVER', 'mock')
  expect(() => readRuntimeConfig('production')).toThrow('Mock OTP cannot run in production')
  vi.unstubAllEnvs()
  const production = await startTestServer(createApp({ prisma: db.prisma, mode: 'production' }))
  try {
    const response = await fetch(production.baseUrl + '/api/customer/auth/otp-challenges', {
      method: 'POST', headers: { Origin: production.baseUrl, 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phone() }),
    })
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: { code: 'TEMPORARILY_UNAVAILABLE' } })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  } finally { await production.close() }
})

test('incorrect codes commit attempts and lock at five checks without creating any verified identity', async () => {
  let now = new Date()
  const service = createCustomerAuthService(db.prisma, createMockOtpAdapter(), () => now)
  const flow = randomToken()
  const challenge = await service.requestCode(phone(), 'attempt-test', flow)
  const wrong = challenge.debugCode === '000000' ? '111111' : '000000'
  for (let index = 0; index < 5; index++) {
    await expect(service.verifyCode(challenge.challengeId, wrong, 'attempt-test', flow)).rejects.toMatchObject({ code: 'OTP_INVALID' })
  }
  await expect(service.verifyCode(challenge.challengeId, challenge.debugCode!, 'attempt-test', flow)).rejects.toMatchObject({ code: 'OTP_THROTTLED' })
  expect(await db.prisma.otpChallenge.findUniqueOrThrow({ where: { id: challenge.challengeId } })).toMatchObject({ attempts: 5, verifiedAt: null })
  now = new Date(now.getTime() + 5 * 60 * 1000)
  await expect(service.verifyCode(challenge.challengeId, challenge.debugCode!, 'attempt-test', flow)).rejects.toMatchObject({ code: 'OTP_EXPIRED' })
})

test('resend enforces the exact cooldown, supersedes old code, and phone budgets normalize across formats', async () => {
  let now = new Date()
  const service = createCustomerAuthService(db.prisma, createMockOtpAdapter(), () => now)
  const flow = randomToken()
  const number = phone()
  const first = await service.requestCode(number, 'resend-test', flow)
  await expect(service.resendCode(first.challengeId, 'resend-test', flow)).rejects.toMatchObject({ code: 'OTP_THROTTLED', retryAfterSeconds: 30 })
  now = new Date(now.getTime() + 30_000)
  const next = await service.resendCode(first.challengeId, 'resend-test', flow)
  expect(next.challengeId).not.toBe(first.challengeId)
  await expect(service.verifyCode(first.challengeId, first.debugCode!, 'resend-test', flow)).rejects.toMatchObject({ code: 'OTP_CONSUMED' })
  for (let index = 0; index < 3; index++) {
    now = new Date(now.getTime() + 30_000)
    await service.requestCode(number, 'resend-test', flow)
  }
  now = new Date(now.getTime() + 30_000)
  await expect(service.requestCode('0' + number.slice(3), 'new-ip', flow)).rejects.toMatchObject({ code: 'OTP_THROTTLED' })
})

test('profile completion is one-use, expires at the exact boundary and concurrent verified flows create one identity', async () => {
  let now = new Date()
  const service = createCustomerAuthService(db.prisma, createMockOtpAdapter(), () => now)
  const number = phone()
  const firstFlow = randomToken()
  const first = await service.requestCode(number, 'profile-race', firstFlow)
  const firstProof = await service.verifyCode(first.challengeId, first.debugCode!, 'profile-race', firstFlow)
  expect(firstProof.next).toBe('name')
  if (firstProof.next !== 'name') throw new Error('Expected new customer')
  now = new Date(now.getTime() + 30_000)
  const secondFlow = randomToken()
  const second = await service.requestCode(number, 'profile-race', secondFlow)
  const secondProof = await service.verifyCode(second.challengeId, second.debugCode!, 'profile-race', secondFlow)
  if (secondProof.next !== 'name') throw new Error('Expected new customer')
  const results = await Promise.all([
    service.completeProfile('First Name', firstProof.proofToken, firstFlow, firstProof.csrfToken),
    service.completeProfile('Second Name', secondProof.proofToken, secondFlow, secondProof.csrfToken),
  ])
  expect(results[0].response.customer.id).toBe(results[1].response.customer.id)
  expect(await db.prisma.customer.count({ where: { phone: number } })).toBe(1)
  await expect(service.completeProfile('Replay', firstProof.proofToken, firstFlow, firstProof.csrfToken)).rejects.toMatchObject({ code: 'CUSTOMER_UNAUTHENTICATED' })

  const expiresFlow = randomToken()
  const expiresCode = await service.requestCode(phone(), 'profile-expiry', expiresFlow)
  const expiresProof = await service.verifyCode(expiresCode.challengeId, expiresCode.debugCode!, 'profile-expiry', expiresFlow)
  if (expiresProof.next !== 'name') throw new Error('Expected profile')
  now = expiresProof.expiresAt
  await expect(service.completeProfile('Expired', expiresProof.proofToken, expiresFlow, expiresProof.csrfToken)).rejects.toMatchObject({ code: 'CUSTOMER_UNAUTHENTICATED' })
})

test('server restart invalidates mock codes but customer identity/session survive database backup and restore', async () => {
  const customer = await registerCustomer()
  const flow = randomToken()
  const now = new Date()
  const first = createCustomerAuthService(db.prisma, createMockOtpAdapter(), () => now)
  const number = phone()
  const challenge = await first.requestCode(number, 'restart-test', flow)
  const restarted = createCustomerAuthService(db.prisma, createMockOtpAdapter(), () => now)
  await expect(restarted.verifyCode(challenge.challengeId, challenge.debugCode!, 'restart-test', flow)).rejects.toMatchObject({ code: 'OTP_EXPIRED' })
  expect((await restarted.requestCode(number, 'restart-test', flow)).challengeId).not.toBe(challenge.challengeId)

  const work = resolve(tmpdir(), 'stc-tests', 'customer-backup-' + randomUUID())
  mkdirSync(work, { recursive: true })
  let restored: ReturnType<typeof createPrismaClient> | undefined
  try {
    const backup = await backupDatabase(db.prisma, work)
    const file = await restoreDatabase({ from: backup, to: resolve(work, 'restored.db') })
    restored = createPrismaClient(file)
    await initializeDatabase(restored)
    const token = customer.cookie.split('=')[1]
    const session = await requireCustomerSession(restored, token, now)
    expect(session.customer.phone).toBe(customer.info.customer.phone)
    expect(session.tokenHash).toBe(hashToken(token))
  } finally {
    await restored?.$disconnect()
    rmSync(work, { recursive: true, force: true })
  }
})

test('same proof races have exactly one winner and concurrent checks cannot consume a challenge twice', async () => {
  const service = createCustomerAuthService(db.prisma, createMockOtpAdapter())
  const flow = randomToken()
  const challenge = await service.requestCode(phone(), 'consume-race', flow)
  const checks = await Promise.allSettled([
    service.verifyCode(challenge.challengeId, challenge.debugCode!, 'consume-race', flow),
    service.verifyCode(challenge.challengeId, challenge.debugCode!, 'consume-race', flow),
  ])
  expect(checks.filter(result => result.status === 'fulfilled')).toHaveLength(1)
  expect(checks.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'OTP_CONSUMED' } })
  const result = checks.find(result => result.status === 'fulfilled')
  if (result?.status !== 'fulfilled' || result.value.next !== 'name') throw new Error('Expected one profile proof')
  const proof = result.value
  const profiles = await Promise.allSettled([
    service.completeProfile('First', proof.proofToken, flow, proof.csrfToken),
    service.completeProfile('Second', proof.proofToken, flow, proof.csrfToken),
  ])
  expect(profiles.filter(profile => profile.status === 'fulfilled')).toHaveLength(1)
  expect(profiles.find(profile => profile.status === 'rejected')).toMatchObject({ reason: { code: 'CUSTOMER_UNAUTHENTICATED' } })
})

test('customer sessions expire at the exact boundary and inactive customers cannot regain access', async () => {
  const customer = await registerCustomer()
  const token = customer.cookie.split('=')[1]
  await expect(requireCustomerSession(db.prisma, token, new Date(customer.info.expiresAt))).rejects.toMatchObject({ code: 'CUSTOMER_UNAUTHENTICATED' })
  await db.prisma.customer.update({ where: { id: customer.info.customer.id }, data: { isActive: false } })
  await expect(requireCustomerSession(db.prisma, token, new Date())).rejects.toMatchObject({ code: 'CUSTOMER_UNAUTHENTICATED' })
  const service = createCustomerAuthService(db.prisma, createMockOtpAdapter())
  const flow = randomToken()
  const challenge = await service.requestCode(customer.info.customer.phone, 'inactive', flow)
  await expect(service.verifyCode(challenge.challengeId, challenge.debugCode!, 'inactive', flow)).rejects.toMatchObject({ code: 'CUSTOMER_UNAUTHENTICATED' })
  expect(await db.prisma.otpChallenge.findUniqueOrThrow({ where: { id: challenge.challengeId } })).toMatchObject({ attempts: 1, verifiedAt: null })
})

test('IP verification budget rejects unknown challenge floods with Retry-After', async () => {
  const ip = 'verification-flood'
  await db.prisma.otpAttempt.createMany({ data: Array.from({ length: 100 }, () => ({ phoneKey: 'unknown', ipKey: hashToken(ip), kind: 'verify', createdAt: new Date() })) })
  const service = createCustomerAuthService(db.prisma, createMockOtpAdapter())
  await expect(service.verifyCode(randomUUID(), '000000', ip, randomToken())).rejects.toMatchObject({ code: 'OTP_THROTTLED', retryAfterSeconds: 3600 })
})

test('request budgets survive independent database clients because the first statement owns the write', async () => {
  const secondClient = createPrismaClient(db.databaseFile)
  await initializeDatabase(secondClient)
  const adapter = createMockOtpAdapter()
  let now = new Date()
  const first = createCustomerAuthService(db.prisma, adapter, () => now)
  const second = createCustomerAuthService(secondClient, adapter, () => now)
  const number = phone()
  try {
    for (let index = 0; index < 4; index++) {
      await first.requestCode(number, 'cross-client', randomToken())
      now = new Date(now.getTime() + 30_000)
    }
    const requests = await Promise.allSettled([
      first.requestCode(number, 'cross-client-a', randomToken()),
      second.requestCode(number, 'cross-client-b', randomToken()),
    ])
    expect(requests.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect(requests.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'OTP_THROTTLED' } })
    expect(await db.prisma.otpAttempt.count({ where: { phoneKey: hashToken(number), kind: 'request' } })).toBe(5)
  } finally { await secondClient.$disconnect() }
})

test('challenge responses use fresh server time after slow delivery so client countdowns cannot extend validity', async () => {
  const startedAt = new Date()
  let now = startedAt
  const mock = createMockOtpAdapter()
  const adapter = {
    ...mock,
    request(id: string, expiresAt: Date) {
      const result = mock.request(id, expiresAt)
      now = new Date(now.getTime() + 5000)
      return result
    },
  }
  const service = createCustomerAuthService(db.prisma, adapter, () => now)
  const challenge = await service.requestCode(phone(), 'slow-delivery', randomToken())
  expect(Date.parse(challenge.serverNow)).toBe(startedAt.getTime() + 5000)
  expect(Date.parse(challenge.expiresAt) - Date.parse(challenge.serverNow)).toBe(295_000)
})
