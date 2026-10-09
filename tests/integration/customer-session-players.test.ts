import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { getSessionPlayers } from '../../server/features/customer/players/players.service.ts'
import { addClubDays, clubDateTimeToInstant, clubToday } from '../../shared/club-time.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'

const HOUR = 60 * 60 * 1000
const now = new Date()
const today = clubToday(now)
const tomorrow = addClubDays(today, 1)
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' }))
})
afterAll(async () => { await server?.close(); await db?.cleanup() })

async function book(sessionId: string, names: string[], deadline = new Date(now.getTime() + 5 * HOUR)) {
  await db.prisma.booking.create({ data: {
    sessionId, actorId: 'test', createRequestId: crypto.randomUUID(), fingerprint: 'test', bookerName: names[0]!, bookerPhone: '+6281200000000',
    quantity: names.length, unitPriceIdr: 0, totalPriceIdr: 0, originalDeadline: deadline,
    participants: { create: names.map((name, index) => ({ position: index + 1, name })) },
  } })
}

test('lists the names holding places in each session of the day, in booking order', async () => {
  const morning = await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(tomorrow, '06:00') })
  const evening = await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(tomorrow, '18:00') })
  const empty = await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(tomorrow, '20:00') })
  const otherDay = await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(addClubDays(today, 2), '06:00') })
  await book(morning.id, ['Andy', 'Andy 2'])
  await book(morning.id, ['Dmitri'])
  await book(evening.id, ['Expired'], new Date(now.getTime() - HOUR))
  await book(otherDay.id, ['Elsewhere'])

  const result = await getSessionPlayers(db.prisma, tomorrow, now)
  expect(result.date).toBe(tomorrow)
  expect(result.sessions).toEqual({ [morning.id]: ['Andy', 'Andy 2', 'Dmitri'] })
  expect(result.sessions[empty.id]).toBeUndefined()
})

test('visitors who are not signed in cannot read player names', async () => {
  const response = await fetch(server.baseUrl + '/api/customer/session-players?date=' + tomorrow, { headers: { Origin: server.baseUrl, Accept: 'application/json' } })
  expect(response.status).toBe(401)
  expect(await response.json()).toEqual({ error: { code: 'CUSTOMER_UNAUTHENTICATED' } })
})
