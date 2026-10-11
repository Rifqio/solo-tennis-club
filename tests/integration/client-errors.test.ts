import express from 'express'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { readRuntimeConfig } from '../../server/config/runtime-config.ts'
import { createClientErrorsRouter } from '../../server/features/client-errors/client-errors.router.ts'
import { createClientErrorService } from '../../server/features/client-errors/client-error.service.ts'
import { errorHandler } from '../../server/http/errors.ts'
import { startTestServer } from '../support/test-server.ts'

const lines: string[] = []
let server: Awaited<ReturnType<typeof startTestServer>>

beforeAll(async () => {
  const app = express()
  app.use(express.json({ limit: '32kb' }))
  app.use('/api/client-errors', createClientErrorsRouter(readRuntimeConfig('development'), createClientErrorService({ log: line => lines.push(line) })))
  app.use(errorHandler)
  server = await startTestServer(app)
})
afterAll(async () => { await server?.close() })

const send = (body: unknown, origin = server.baseUrl) => fetch(`${server.baseUrl}/api/client-errors`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
})
const report = { code: 'STC-7F3A-21', kind: 'render', path: '/bookings/abc', message: 'Cannot read properties of undefined' }

test('a 500-page report lands in the server log under its code, on one line', async () => {
  expect((await send({ ...report, message: 'line one\nfake log line' })).status).toBe(204)
  expect(lines.at(-1)).toBe('Client error STC-7F3A-21 [render] on /bookings/abc: line one fake log line')
})

test('reports with a made-up code, extra fields or from another site are refused', async () => {
  expect((await send({ ...report, code: 'hello' })).status).toBe(400)
  expect((await send({ ...report, phone: '+628123' })).status).toBe(400)
  expect((await send(report, 'https://elsewhere.example')).status).toBe(403)
})

test('one visitor cannot flood the log', async () => {
  const before = lines.length
  for (let index = 0; index < 30; index++) await send(report)
  expect(lines.length - before).toBeLessThanOrEqual(20)
})
