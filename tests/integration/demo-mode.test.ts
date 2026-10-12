import { mkdtempSync, readdirSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'
import { createApp } from '../../server/app.ts'
import { readRuntimeConfig } from '../../server/config/runtime-config.ts'
import { DEMO_ADMIN_EMAIL } from '../../server/auth/demo-admin.ts'
import { SAMPLE_SESSION_COUNT } from '../../server/ops/sample-data.ts'
import type { AppConfigResponse } from '../../shared/api/app-config.ts'
import type { OtpChallengeResponse } from '../../shared/api/customer-auth.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { registerCustomer } from '../support/customer-fixtures.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'

const uploadsDir = mkdtempSync(resolve(tmpdir(), 'stc-demo-uploads-'))
const privateDir = mkdtempSync(resolve(tmpdir(), 'stc-demo-private-'))
let db: Awaited<ReturnType<typeof createTestDatabase>>

beforeAll(async () => { db = await createTestDatabase() })
afterAll(async () => {
  await db?.cleanup()
  rmSync(uploadsDir, { recursive: true, force: true }); rmSync(privateDir, { recursive: true, force: true })
})
afterEach(() => { vi.unstubAllEnvs() })

async function demoServer(env: Record<string, string> = {}) {
  vi.stubEnv('LAFU_DEMO', '1')
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value)
  return startTestServer(createApp({ prisma: db.prisma, mode: 'production', uploadsDir, privateDir, publicDir: resolve('public') }))
}

test('the mock OTP runs in production only with LAFU_DEMO=1', () => {
  vi.stubEnv('LAFU_OTP_DRIVER', 'mock')
  expect(() => readRuntimeConfig('production')).toThrow('Mock OTP cannot run in production')
  vi.stubEnv('LAFU_DEMO', '1')
  expect(readRuntimeConfig('production')).toMatchObject({ demo: true, otpDriver: 'mock' })
  vi.unstubAllEnvs()
  expect(readRuntimeConfig('production')).toMatchObject({ demo: false, otpDriver: 'disabled' })
})

test('a production server says whether the admin demo button is offered', async () => {
  const plain = await startTestServer(createApp({ prisma: db.prisma, mode: 'production', uploadsDir, privateDir }))
  try {
    expect(await (await fetch(plain.baseUrl + '/api/public/app-config')).json()).toEqual({ demo: false, adminShortcut: false } satisfies AppConfigResponse)
  } finally { await plain.close() }
  const demo = await demoServer()
  try {
    expect(await (await fetch(demo.baseUrl + '/api/public/app-config')).json()).toEqual({ demo: true, adminShortcut: true } satisfies AppConfigResponse)
  } finally { await demo.close() }
})

test('on the demo a visitor gets the code on screen and the demo admin signs in with one button', async () => {
  const server = await demoServer()
  try {
    const challenge = await fetch(server.baseUrl + '/api/customer/auth/otp-challenges', {
      method: 'POST', headers: { Origin: server.baseUrl, 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: '+6281234598001' }),
    })
    expect(challenge.status).toBe(201)
    const body = await challenge.json() as OtpChallengeResponse
    expect(body.development).toBe(true)
    expect(body.debugCode).toMatch(/^\d{6}$/)

    const admin = await fetch(server.baseUrl + '/api/admin/auth/dev-sign-in', { method: 'POST', headers: { Origin: server.baseUrl, 'Content-Type': 'application/json' }, body: '{}' })
    expect(admin.status).toBe(200)
    expect((await admin.json()).admin.email).toBe(DEMO_ADMIN_EMAIL)
    expect(admin.headers.get('set-cookie')).toContain('Secure')
    const elsewhere = await fetch(server.baseUrl + '/api/admin/auth/dev-sign-in', { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' })
    expect(elsewhere.status).toBe(403)
  } finally { await server.close() }
})

test('the daily cron needs its secret, expires lapsed bookings and resets the demo', async () => {
  const noSecret = await demoServer()
  try {
    expect((await fetch(noSecret.baseUrl + '/api/cron/daily')).status).toBe(404)
  } finally { await noSecret.close() }

  const server = await demoServer({ CRON_SECRET: 'test-cron-secret' })
  try {
    expect((await fetch(server.baseUrl + '/api/cron/daily', { headers: { Authorization: 'Bearer wrong' } })).status).toBe(401)

    const member = await registerCustomer(server.baseUrl, '+6281234598002', 'Visitor')
    const catalog = await createSampleCatalog(db.prisma)
    const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + 72 * 3600_000) })
    await db.prisma.booking.create({ data: {
      sessionId: session.id, customerId: member.customerId, actorId: member.customerId, createRequestId: crypto.randomUUID(), fingerprint: 'test',
      status: 'awaiting_payment', bookerName: 'Visitor', bookerPhone: '+6281234598002', quantity: 1, unitPriceIdr: 100000, totalPriceIdr: 100000,
      originalDeadline: new Date(Date.now() - 3600_000), participants: { create: [{ position: 1, name: 'P1' }] },
    } })
    mkdirSync(resolve(uploadsDir, 'sessions', session.id), { recursive: true })
    writeFileSync(resolve(uploadsDir, 'sessions', session.id, 'a'.repeat(32) + '.webp'), 'x')
    mkdirSync(resolve(privateDir, 'proofs', 'somebooking'), { recursive: true })
    writeFileSync(resolve(privateDir, 'proofs', 'somebooking', 'b'.repeat(32) + '.jpg'), 'x')

    const run = await fetch(server.baseUrl + '/api/cron/daily', { headers: { Authorization: 'Bearer test-cron-secret' } })
    expect(run.status).toBe(200)
    expect(await run.json()).toEqual({ expired: 1, demoReset: true })

    expect(await db.prisma.booking.count()).toBe(0)
    expect(await db.prisma.customer.count()).toBe(0)
    expect(await db.prisma.classSession.findUnique({ where: { id: session.id } })).toBeNull()
    const upcoming = await db.prisma.classSession.count({ where: { isSample: true, startsAt: { gt: new Date() } } })
    expect(upcoming).toBeGreaterThan(SAMPLE_SESSION_COUNT - 4)
    expect(await db.prisma.sessionPhoto.count()).toBeGreaterThan(0)
    expect(await db.prisma.adminAccount.count({ where: { email: DEMO_ADMIN_EMAIL } })).toBe(1)
    expect(existsSync(resolve(uploadsDir, 'sessions')) ? readdirSync(resolve(uploadsDir, 'sessions'), { recursive: true }).filter(name => String(name).endsWith('.webp')) : []).toEqual([])
    expect(readdirSync(resolve(privateDir, 'proofs', 'somebooking'))).toEqual([])
  } finally { await server.close() }
})
