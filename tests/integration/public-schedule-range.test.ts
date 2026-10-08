import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { getPublicSchedule } from '../../server/features/public/schedule.service.ts'
import { addClubDays, clubDateTimeToInstant, clubToday } from '../../shared/club-time.ts'
import type { PublicScheduleResponse } from '../../shared/api/public.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'

let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let catalog: Awaited<ReturnType<typeof createSampleCatalog>>
const today = clubToday()
beforeAll(async () => {
  db = await createTestDatabase()
  catalog = await createSampleCatalog(db.prisma)
  server = await startTestServer(createApp({ prisma: db.prisma }))
})
afterAll(async () => { await server?.close(); await db?.cleanup() })

async function schedule(date: string) {
  return fetch(server.baseUrl + '/api/public/schedule?date=' + date)
}

test('today and today + 365 are inside the public window', async () => {
  for (const date of [today, addClubDays(today, 365)]) {
    const response = await schedule(date)
    expect(response.status).toBe(200)
    const body = await response.json() as PublicScheduleResponse
    expect(body).toMatchObject({ date, today, minDate: today, maxDate: addClubDays(today, 365) })
  }
})

test('dates outside the window are rejected', async () => {
  for (const date of [addClubDays(today, -1), addClubDays(today, 366)]) {
    const response = await schedule(date)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { code: 'DATE_OUT_OF_RANGE' } })
  }
})

test('nextDate is the nearest later club date with a session, counting cancelled sessions', async () => {
  const base = addClubDays(today, 200)
  expect((await getPublicSchedule(db.prisma, base)).nextDate).toBeNull()
  await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(addClubDays(base, 5), '09:00') })
  await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(addClubDays(base, 2), '00:00'), status: 'cancelled' })
  expect((await getPublicSchedule(db.prisma, base)).nextDate).toBe(addClubDays(base, 2))
  expect((await getPublicSchedule(db.prisma, addClubDays(base, 2))).nextDate).toBe(addClubDays(base, 5))
  expect((await getPublicSchedule(db.prisma, addClubDays(base, 5))).nextDate).toBeNull()
})

test('a session on the selected date itself never becomes nextDate', async () => {
  const day = addClubDays(today, 300)
  await createSampleSession(db.prisma, { catalog, startsAt: clubDateTimeToInstant(day, '23:59') })
  const body = await getPublicSchedule(db.prisma, day)
  expect(body.sessions).toHaveLength(1)
  expect(body.nextDate).toBeNull()
})
