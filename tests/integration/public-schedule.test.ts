import { afterAll, beforeAll, expect, test } from 'vitest'
import { createApp } from '../../server/app.ts'
import { clubToday } from '../../shared/club-time.ts'
import type { PublicScheduleResponse } from '../../shared/api/public.ts'
import { createTestDatabase } from '../support/test-db.ts'
import { startTestServer } from '../support/test-server.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'

let db: Awaited<ReturnType<typeof createTestDatabase>>
let server: Awaited<ReturnType<typeof startTestServer>>
let sample: Awaited<ReturnType<typeof createSampleSession>>
beforeAll(async () => {
  db = await createTestDatabase()
  sample = await createSampleSession(db.prisma, { catalog: await createSampleCatalog(db.prisma) })
  server = await startTestServer(createApp({ prisma: db.prisma }))
})
afterAll(async () => { await server?.close(); await db?.cleanup() })
test('signed-out schedule returns only public summary fields and real remaining capacity', async () => {
  const response = await fetch(server.baseUrl + '/api/public/schedule?date=' + clubToday())
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('no-store')
  const body = await response.json() as PublicScheduleResponse
  expect(body.sessions).toHaveLength(1)
  expect(body.sessions[0]).toMatchObject({ id: sample.id, remainingPlaces: 8, availability: 'available', startTime: '18:00', isSample: true })
  expect(Object.keys(body.sessions[0]).sort()).toEqual(['id', 'startsAt', 'endsAt', 'date', 'startTime', 'endTime', 'className', 'levelName', 'venueName', 'priceIdr', 'remainingPlaces', 'availability', 'isSample'].sort())
})
test('invalid calendar dates are rejected before querying', async () => {
  const response = await fetch(server.baseUrl + '/api/public/schedule?date=2026-13-40')
  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: { code: 'INVALID_DATE' } })
})
test('unknown API routes return JSON rather than the SPA', async () => {
  const response = await fetch(server.baseUrl + '/api/unknown')
  expect(response.status).toBe(404)
  expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND' } })
})
