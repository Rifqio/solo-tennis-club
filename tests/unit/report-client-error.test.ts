import { expect, test } from 'vitest'
import { CLIENT_ERROR_CODE_PATTERN } from '../../shared/api/client-errors.ts'
import { describeError, isChunkLoadError, makeReportCode } from '../../src/features/errors/report-client-error.ts'

test('report codes read like STC-7F3A-21 and always pass the server check', () => {
  expect(makeReportCode(() => 0)).toBe('STC-0000-00')
  expect(makeReportCode(() => 0.999999)).toBe('STC-FFFF-99')
  for (let index = 0; index < 200; index++) expect(makeReportCode()).toMatch(CLIENT_ERROR_CODE_PATTERN)
})

test('a chunk missing after a deploy is told apart from a crash', () => {
  expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /assets/PayPage-1a2b.js'))).toBe(true)
  expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
  expect(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'session')"))).toBe(false)
})

test('error descriptions stay short', () => {
  expect(describeError(new RangeError('x'.repeat(900)))).toHaveLength(500)
  expect(describeError('plain')).toBe('plain')
})
