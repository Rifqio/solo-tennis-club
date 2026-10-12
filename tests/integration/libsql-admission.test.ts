import { randomUUID } from 'node:crypto'
import { copyFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterAll, beforeAll, expect, inject, test } from 'vitest'
import { createPrismaClient, initializeDatabase } from '../../server/db.ts'
import { databaseUrl } from '../../server/config/database-file.ts'
import type { PrismaClient } from '../../server/generated/prisma/client.ts'
import { createAdmissionService } from '../../server/features/booking-admission/admission.service.ts'
import { DatabaseBusyError } from '../../server/database/transaction.ts'
import { ApiError } from '../../server/http/errors.ts'
import { getOccupiedPlaceCounts } from '../../server/features/capacity/occupancy.ts'
import { createSampleCatalog, createSampleSession } from '../support/fixtures.ts'
import { provisionTestAdmin } from '../support/admin-fixtures.ts'

// The hosted demo runs on Turso through the libSQL adapter. This drives the same admission race through that adapter
// (against a local file, the closest stand-in available offline) so the capacity lock is proven there too.
const root = resolve(tmpdir(), 'lafu-tests')
const file = resolve(root, 'libsql-' + randomUUID() + '.db')
const target = { url: databaseUrl(file), local: false }
let first: PrismaClient
let second: PrismaClient
let adminId: string

beforeAll(async () => {
  mkdirSync(root, { recursive: true })
  copyFileSync(inject('templateDatabaseFile'), file)
  first = createPrismaClient(target)
  second = createPrismaClient(target)
  await initializeDatabase(first, { local: false })
  await initializeDatabase(second, { local: false })
  const credentials = await provisionTestAdmin(first)
  adminId = (await first.adminAccount.findUniqueOrThrow({ where: { email: credentials.email } })).id
})

afterAll(async () => {
  await first?.$disconnect()
  await second?.$disconnect()
  // libSQL keeps the file open on Windows until the process exits; the temp folder is cleared by later runs.
  for (const suffix of ['', '-wal', '-shm']) { try { rmSync(file + suffix, { force: true }) } catch { /* still open */ } }
})

test('admissions from two libSQL clients at once never exceed capacity', async () => {
  const catalog = await createSampleCatalog(first)
  const session = await createSampleSession(first, { catalog, startsAt: new Date(Date.now() + 48 * 3600_000), maxParticipants: 6 })
  const services = [createAdmissionService(first), createAdmissionService(second)]
  const attempts = Array.from({ length: 10 }, (_, index) => services[index % 2]!.admit({
    actor: { kind: 'admin', id: adminId },
    customerId: null,
    booker: { name: 'Racer', phone: '+6281234699999' },
    input: { sessionId: session.id, quantity: 2, participantNames: ['A', 'B'], expectedSessionVersion: 1, createRequestId: randomUUID() },
  }))
  const results = await Promise.allSettled(attempts)
  const refusals = results.flatMap(result => result.status === 'rejected' ? [result.reason as Error] : [])
  expect(refusals.every(reason => reason instanceof DatabaseBusyError || (reason instanceof ApiError && reason.code === 'CAPACITY_UNAVAILABLE'))).toBe(true)
  const admitted = results.length - refusals.length
  expect(admitted).toBeLessThanOrEqual(3)
  expect(admitted).toBeGreaterThan(0)
  expect((await getOccupiedPlaceCounts(first, [session.id])).get(session.id)).toBe(admitted * 2)
})

test('libSQL connections keep foreign keys on, inside and outside transactions', async () => {
  const outside = await first.$queryRawUnsafe<Array<{ foreign_keys: bigint | number }>>('PRAGMA foreign_keys')
  const inside = await first.$transaction(transaction => transaction.$queryRawUnsafe<Array<{ foreign_keys: bigint | number }>>('PRAGMA foreign_keys'))
  expect(Number(outside[0]?.foreign_keys)).toBe(1)
  expect(Number(inside[0]?.foreign_keys)).toBe(1)
})
