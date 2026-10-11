import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import type { CustomerAccountResponse, CustomerPhoneChallengeResponse } from '../../shared/api/customer-account.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { registerCustomer } from '../support/customer-fixtures.ts'

const HOUR = 60 * 60 * 1000
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
let phoneIndex = 7000
const phone = () => '+628123462' + String(phoneIndex++)

beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' }))
})
afterAll(async () => { await server?.close(); await db?.cleanup() })

type Member = Awaited<ReturnType<typeof registerCustomer>>
const call = (member: Member, method: string, path: string, body?: unknown, csrf = member.csrfToken) => fetch(`${server.baseUrl}/api/customer/account${path}`, {
  method, headers: { Origin: server.baseUrl, 'Content-Type': 'application/json', Cookie: member.cookie, 'X-CSRF-Token': csrf },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})

async function book(customerId: string, startsInHours: number, status: string, quantity = 1) {
  const session = await createSampleSession(db.prisma, { catalog, startsAt: new Date(Date.now() + startsInHours * HOUR) })
  await db.prisma.booking.create({ data: {
    sessionId: session.id, customerId, actorId: customerId, actorKind: 'customer', createRequestId: crypto.randomUUID(), fingerprint: 'test', status,
    bookerName: 'Andy', bookerPhone: '+6281200000000', quantity, unitPriceIdr: 100000, totalPriceIdr: 100000 * quantity, originalDeadline: new Date(Date.now() + HOUR),
    participants: { create: Array.from({ length: quantity }, (_, index) => ({ position: index + 1, name: `P${index + 1}` })) },
  } })
}

test('the account shows who is signed in, sessions played and bookings still ahead', async () => {
  const member = await registerCustomer(server.baseUrl, phone(), 'Andy')
  await book(member.customerId, -48, 'confirmed')
  await book(member.customerId, -24, 'expired')
  await book(member.customerId, 48, 'confirmed')
  await book(member.customerId, 72, 'awaiting_payment')
  const account = await (await call(member, 'GET', '')).json() as CustomerAccountResponse
  expect(account).toMatchObject({ customer: { displayName: 'Andy' }, stats: { sessionsPlayed: 1, activeBookings: 2 } })
  expect((await fetch(`${server.baseUrl}/api/customer/account`)).status).toBe(401)
})

test('a member renames themselves; empty names and a missing CSRF token are refused', async () => {
  const member = await registerCustomer(server.baseUrl, phone(), 'Andy')
  const renamed = await (await call(member, 'PUT', '/name', { displayName: '  Andy   Pratama ' })).json() as CustomerAccountResponse
  expect(renamed.customer.displayName).toBe('Andy Pratama')
  expect((await call(member, 'PUT', '/name', { displayName: '   ' })).status).toBe(400)
  expect((await call(member, 'PUT', '/name', { displayName: 'Lain' }, 'wrong')).status).toBe(403)
})

test('changing number: a code goes to the new number, and only the right code from this session moves the account', async () => {
  const member = await registerCustomer(server.baseUrl, phone(), 'Andy')
  const current = (await (await call(member, 'GET', '')).json() as CustomerAccountResponse).customer.phone
  expect((await (await call(member, 'POST', '/phone-challenges', { phone: current })).json()).error.fields).toEqual({ phone: 'SAME_PHONE' })

  const next = phone()
  const challenge = await (await call(member, 'POST', '/phone-challenges', { phone: next })).json() as CustomerPhoneChallengeResponse
  expect((await call(member, 'POST', '/phone-verifications', { challengeId: challenge.challengeId, code: challenge.debugCode === '000000' ? '111111' : '000000' })).status).toBe(400)

  // Another member's session cannot confirm this change.
  const stranger = await registerCustomer(server.baseUrl, phone(), 'Lain')
  expect((await call(stranger, 'POST', '/phone-verifications', { challengeId: challenge.challengeId, code: challenge.debugCode })).status).toBe(400)

  const moved = await (await call(member, 'POST', '/phone-verifications', { challengeId: challenge.challengeId, code: challenge.debugCode })).json() as CustomerAccountResponse
  expect(moved.customer.phone).toBe(next)
  expect((await call(member, 'POST', '/phone-verifications', { challengeId: challenge.challengeId, code: challenge.debugCode })).status).toBe(409)
})

test("a number that belongs to another account is refused only after its code is confirmed", async () => {
  const member = await registerCustomer(server.baseUrl, phone(), 'Andy')
  const takenPhone = phone()
  await registerCustomer(server.baseUrl, takenPhone, 'Pemilik')
  const challenge = await (await call(member, 'POST', '/phone-challenges', { phone: takenPhone })).json() as CustomerPhoneChallengeResponse
  expect(challenge.challengeId).toBeTruthy()
  const refused = await call(member, 'POST', '/phone-verifications', { challengeId: challenge.challengeId, code: challenge.debugCode })
  expect(refused.status).toBe(409)
  expect((await refused.json()).error.fields).toEqual({ phone: 'PHONE_IN_USE' })
})
