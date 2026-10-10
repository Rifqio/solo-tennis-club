import { expect, test } from 'vitest'
import { normalizeCustomerName, normalizeCustomerPhone } from '../../shared/customer-rules.ts'
import { safeCustomerReturnPath } from '../../src/features/customer/auth/customer-return-path.ts'

test('normalizes Indonesian and international phones to one verified identity key', () => {
  expect(normalizeCustomerPhone('0812 3456 7890')).toBe('+6281234567890')
  expect(normalizeCustomerPhone('+62 812-3456-7890')).toBe('+6281234567890')
  expect(normalizeCustomerPhone('+1 202 555 0123')).toBe('+12025550123')
  for (const value of ['081', 'hello +6281234567890', '+6281234567890 ext 2', '1'.repeat(51), '']) {
    expect(normalizeCustomerPhone(value)).toBeNull()
  }
})

test('names remain human-readable and bounded without imposing an ASCII-only identity', () => {
  expect(normalizeCustomerName('  Dwi   Ayu  ')).toBe('Dwi Ayu')
  expect(normalizeCustomerName('李安')).toBe('李安')
  expect(normalizeCustomerName('')).toBeNull()
  expect(normalizeCustomerName('a'.repeat(121))).toBeNull()
  expect(normalizeCustomerName('A\u0000B')).toBeNull()
})

test('return paths preserve public date/session intent but reject external and admin destinations', () => {
  expect(safeCustomerReturnPath('/schedule?date=2026-10-20&session=session123&phone=secret')).toBe('/schedule?date=2026-10-20&session=session123')
  expect(safeCustomerReturnPath('/?date=2026-10-20&session=session123')).toBe('/schedule?date=2026-10-20&session=session123')
  expect(safeCustomerReturnPath('/?date=no&session=bad!')).toBe('/schedule')
  expect(safeCustomerReturnPath('/club')).toBe('/')
  expect(safeCustomerReturnPath('/')).toBe('/')
  for (const value of ['//evil.test', '/\\evil.test', '/admin', 'https://evil.test', null]) {
    expect(safeCustomerReturnPath(value)).toBe('/')
  }
})
