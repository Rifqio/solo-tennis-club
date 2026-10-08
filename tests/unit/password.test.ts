import { expect, test } from 'vitest'
import { hashPassword, verifyPassword, verifyAgainstDummy } from '../../server/auth/password.ts'
test('scrypt hashes verify, reject wrong passwords, use unique salts and refuse malformed hashes', async () => {
  const plain = 'test-only-password-long-enough'
  const first = await hashPassword(plain), second = await hashPassword(plain)
  expect(first).not.toBe(second)
  expect(first).toMatch(/^scrypt\$131072\$8\$1\$/)
  expect(await verifyPassword(plain, first)).toBe(true)
  expect(await verifyPassword('incorrect', first)).toBe(false)
  for (const hash of ['bad', first + 'junk', first.replace('131072', '1'), 'scrypt$131072$8$1$?$?']) expect(await verifyPassword(plain, hash)).toBe(false)
  expect(await verifyAgainstDummy(plain)).toBe(false)
})
