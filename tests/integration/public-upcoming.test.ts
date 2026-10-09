import { afterAll, beforeAll, expect, test } from 'vitest'
import { getUpcomingBookable, UPCOMING_LIMIT } from '../../server/features/public/upcoming.service.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'

const HOUR = 60 * 60 * 1000
const now = new Date()
let db: Awaited<ReturnType<typeof createTestDatabase>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
})
afterAll(async () => { await db?.cleanup() })

async function holdPlaces(sessionId: string, quantity: number) {
  await db.prisma.booking.create({ data: {
    sessionId, actorId: 'test', createRequestId: crypto.randomUUID(), fingerprint: 'test', bookerName: 'Test', bookerPhone: '+6281200000000',
    quantity, unitPriceIdr: 0, totalPriceIdr: 0, originalDeadline: new Date(now.getTime() + 5 * HOUR),
    participants: { create: Array.from({ length: quantity }, (_, position) => ({ position, name: 'P' + position })) },
  } })
}

test('lists only sessions still open for booking, with places, soonest first', async () => {
  const closed = await createSampleSession(db.prisma, { catalog, startsAt: new Date(now.getTime() + 2 * HOUR) })
  const cancelled = await createSampleSession(db.prisma, { catalog, startsAt: new Date(now.getTime() + 24 * HOUR), status: 'cancelled' })
  const full = await createSampleSession(db.prisma, { catalog, startsAt: new Date(now.getTime() + 25 * HOUR), maxParticipants: 2 })
  await holdPlaces(full.id, 2)
  const later = await createSampleSession(db.prisma, { catalog, startsAt: new Date(now.getTime() + 48 * HOUR) })
  const sooner = await createSampleSession(db.prisma, { catalog, startsAt: new Date(now.getTime() + 26 * HOUR), maxParticipants: 4 })
  await holdPlaces(sooner.id, 1)

  const { sessions } = await getUpcomingBookable(db.prisma, now)
  const ids = sessions.map(session => session.id)
  expect(ids).toEqual([sooner.id, later.id])
  expect(ids).not.toContain(closed.id)
  expect(ids).not.toContain(cancelled.id)
  expect(ids).not.toContain(full.id)
  expect(sessions[0]!.remainingPlaces).toBe(3)
})

test('caps the list', async () => {
  for (let day = 3; day < 3 + UPCOMING_LIMIT + 2; day++) {
    await createSampleSession(db.prisma, { catalog, startsAt: new Date(now.getTime() + day * 24 * HOUR) })
  }
  const { sessions } = await getUpcomingBookable(db.prisma, now)
  expect(sessions).toHaveLength(UPCOMING_LIMIT)
})
