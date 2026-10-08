import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }
function derive(plain: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(plain, salt, 64, options, (error, key) => error ? reject(error) : resolve(key)))
}
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16)
  return ['scrypt', options.N, options.r, options.p, salt.toString('base64'), (await derive(plain, salt)).toString('base64')].join('$')
}
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts.slice(0, 4).join('$') !== 'scrypt$131072$8$1') return false
  const salt = Buffer.from(parts[4], 'base64'), key = Buffer.from(parts[5], 'base64')
  if (salt.length !== 16 || key.length !== 64 || salt.toString('base64') !== parts[4] || key.toString('base64') !== parts[5]) return false
  return timingSafeEqual(await derive(plain, salt), key)
}
const dummySalt = randomBytes(16)
export async function verifyAgainstDummy(plain: string): Promise<false> {
  await derive(plain, dummySalt)
  return false
}
