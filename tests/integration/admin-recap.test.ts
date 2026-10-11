import { unzipSync, strFromU8 } from 'fflate'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { getRecap, recapWindows } from '../../server/features/admin/recap/recap.service.ts'
import { clubDateTimeToInstant } from '../../shared/club-time.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { adminFetch, provisionTestAdmin, signInAs } from '../support/admin-fixtures.ts'

const HOUR = 60 * 60 * 1000
// The club's "today" in these tests: Rabu 10 Maret 2030, noon WIB.
const NOW = clubDateTimeToInstant('2030-03-10', '12:00')
let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let admin: Awaited<ReturnType<typeof signInAs>>

async function book(sessionId: string, status: string, quantity: number, totalPriceIdr: number, deadline = new Date(NOW.getTime() + 2 * HOUR), confirmedAt = NOW) {
  await db.prisma.booking.create({ data: {
    sessionId, actorId: 'admin', actorKind: 'admin', createRequestId: crypto.randomUUID(), fingerprint: 'test', status,
    bookerName: 'Budi', bookerPhone: '+6281200000000', quantity, unitPriceIdr: totalPriceIdr / quantity, totalPriceIdr,
    originalDeadline: deadline, confirmedAt: status === 'confirmed' ? confirmedAt : null,
    participants: { create: Array.from({ length: quantity }, (_, index) => ({ position: index + 1, name: `P${index + 1}` })) },
  } })
}

beforeAll(async () => {
  db = await createTestDatabase()
  const morning = await createSampleCatalog(db.prisma)
  const evening = await createSampleCatalog(db.prisma)
  // March 2030 (running): one held session, one upcoming, one cancelled.
  const held = await createSampleSession(db.prisma, { catalog: morning, startsAt: clubDateTimeToInstant('2030-03-05', '06:00'), maxParticipants: 8 })
  await book(held.id, 'confirmed', 2, 200000)
  await book(held.id, 'expired', 1, 100000, new Date(NOW.getTime() - HOUR))
  const upcoming = await createSampleSession(db.prisma, { catalog: evening, startsAt: clubDateTimeToInstant('2030-03-20', '18:00'), maxParticipants: 4 })
  await book(upcoming.id, 'confirmed', 1, 100000)
  await book(upcoming.id, 'awaiting_payment', 2, 200000)
  const cancelled = await createSampleSession(db.prisma, { catalog: morning, startsAt: clubDateTimeToInstant('2030-03-07', '06:00'), status: 'cancelled' })
  await book(cancelled.id, 'confirmed', 3, 300000)
  // February 2030: one booking paid by 10 February (inside the comparison), one paid after it.
  const early = await createSampleSession(db.prisma, { catalog: morning, startsAt: clubDateTimeToInstant('2030-02-03', '06:00') })
  await book(early.id, 'confirmed', 1, 150000, NOW, clubDateTimeToInstant('2030-02-02', '09:00'))
  const late = await createSampleSession(db.prisma, { catalog: morning, startsAt: clubDateTimeToInstant('2030-02-20', '06:00') })
  await book(late.id, 'confirmed', 5, 500000, NOW, clubDateTimeToInstant('2030-02-15', '09:00'))
  server = await startTestServer(createApp({ prisma: db.prisma, mode: 'development' }))
  admin = await signInAs(server.baseUrl, await provisionTestAdmin(db.prisma, { displayName: 'Admin Rekap' }))
})
afterAll(async () => { await server?.close(); await db?.cleanup() })

test('a running month counts every paid booking of its sessions and compares with what was paid by the same day last month', async () => {
  const recap = await getRecap(db.prisma, '2030-03', NOW)
  expect(recap).toMatchObject({
    month: '2030-03', partial: true, latestMonth: '2030-03', range: { from: '2030-03-01', to: '2030-03-31' },
    revenueIdr: 300000,
    comparison: { month: '2030-02', from: '2030-02-01', to: '2030-02-10', revenueIdr: 150000, changePct: 100 },
    pending: { amountIdr: 200000, bookings: 1 },
    places: { used: 5, capacity: 12 },
    sessions: { held: 1, upcoming: 1, cancelled: 1 },
  })
  expect(recap.months.map(entry => [entry.month, entry.revenueIdr])).toEqual([
    ['2029-10', 0], ['2029-11', 0], ['2029-12', 0], ['2030-01', 0], ['2030-02', 650000], ['2030-03', 300000],
  ])
  expect(recap.classes.map(row => [row.revenueIdr, row.sessions, row.used, row.capacity])).toEqual([[200000, 1, 2, 8], [100000, 1, 3, 4]])
})

test('a finished month covers every day and compares with the whole month before', async () => {
  const recap = await getRecap(db.prisma, '2030-02', NOW)
  expect(recap).toMatchObject({ partial: false, range: { from: '2030-02-01', to: '2030-02-28' }, revenueIdr: 650000, comparison: null })
})

test('the comparison days stop at the shorter month end', () => {
  expect(recapWindows('2030-03', clubDateTimeToInstant('2030-03-31', '09:00')).comparison).toMatchObject({ from: '2030-02-01', to: '2030-02-28' })
})

// Over HTTP the server uses the real clock, so these use a month already past (the numbers are covered above).
test('admins read the recap and download the workbook; months ahead and bad months are refused', async () => {
  const shown = await adminFetch(server.baseUrl, admin, '/recap?month=2025-01')
  expect(shown.status).toBe(200)
  expect(await shown.json()).toMatchObject({ month: '2025-01', partial: false, revenueIdr: 0, classes: [] })

  const file = await adminFetch(server.baseUrl, admin, '/recap/export?month=2025-01')
  expect(file.headers.get('content-type')).toContain('spreadsheetml')
  expect(file.headers.get('content-disposition')).toContain('rekap-STC-2025-01.xlsx')
  const parts = unzipSync(new Uint8Array(await file.arrayBuffer()))
  const workbook = strFromU8(parts['xl/workbook.xml']!)
  for (const name of ['Ringkasan', 'Per kelas', 'Booking']) expect(workbook).toContain(`name="${name}"`)

  const ahead = await adminFetch(server.baseUrl, admin, '/recap?month=2999-01')
  expect((await ahead.json()).error.code).toBe('DATE_OUT_OF_RANGE')
  expect((await adminFetch(server.baseUrl, admin, '/recap?month=2030-13')).status).toBe(400)
  expect((await fetch(`${server.baseUrl}/api/admin/recap?month=2025-01`)).status).toBe(401)
})
