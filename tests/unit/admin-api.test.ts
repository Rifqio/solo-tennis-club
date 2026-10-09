import { afterEach, expect, test, vi } from 'vitest'
import { adminGet, adminSend } from '../../src/lib/admin-api.ts'
import { safeAdminReturnPath } from '../../src/features/admin/auth/return-path.ts'

afterEach(() => vi.unstubAllGlobals())
test('mutations send same-origin cookies and only the supplied in-memory CSRF token; 204 sign-out succeeds', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetch)
  expect(await adminSend('POST', '/api/admin/auth/sign-out', {}, { csrfToken: 'test-token' })).toEqual({ kind: 'ok', data: undefined })
  expect(fetch).toHaveBeenCalledWith('/api/admin/auth/sign-out', expect.objectContaining({
    credentials: 'same-origin', cache: 'no-store', method: 'POST', body: '{}',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': 'test-token' },
  }))
})
test('401 triggers expiry, while sign-in failure does not expire an unrelated client', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 })))
  const expire = vi.fn()
  expect(await adminGet('/api/admin/sessions', { onUnauthenticated: expire })).toMatchObject({ kind: 'http', status: 401, code: 'UNAUTHENTICATED' })
  expect(expire).toHaveBeenCalledOnce()
  await adminSend('POST', '/api/admin/auth/sign-in', { email: 'test@lafu.test', password: 'test-only' })
  expect(expire).toHaveBeenCalledOnce()
})
test('preserves field/conflict/retry errors and distinguishes proxy, offline, and aborted failures', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: { code: 'SIGN_IN_THROTTLED', retryAfterSeconds: 75 } }, { status: 429 })))
  expect(await adminGet('/api/admin/sessions')).toMatchObject({ kind: 'http', retryAfterSeconds: 75 })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: { code: 'STALE_VERSION', fields: { name: 'DUPLICATE_NAME' }, latest: { version: 2 } } }, { status: 409 })))
  expect(await adminGet('/api/admin/sessions')).toMatchObject({ fields: { name: 'DUPLICATE_NAME' }, latest: { version: 2 } })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('proxy error', { status: 502 })))
  expect(await adminGet('/api/admin/sessions')).toMatchObject({ kind: 'http', code: 'INTERNAL' })
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
  expect(await adminGet('/api/admin/sessions')).toEqual({ kind: 'network' })
  const controller = new AbortController(); controller.abort()
  expect(await adminGet('/api/admin/sessions', { signal: controller.signal })).toEqual({ kind: 'aborted' })
})
test('API credentials cannot be sent to an external URL', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
  await expect(adminSend('POST', 'https://example.test/api/admin/sessions', {}, { csrfToken: 'private' })).rejects.toThrow('Admin API path required')
  await expect(adminSend('POST', '/api/admin/../../outside', {}, { csrfToken: 'private' })).rejects.toThrow('Admin API path required')
  expect(fetch).not.toHaveBeenCalled()
})
test('sign-in return paths cannot escape admin routes, loop through sign-in, or navigate to another origin', () => {
  expect(safeAdminReturnPath('/admin/sessions?date=2026-10-09')).toBe('/admin/sessions?date=2026-10-09')
  for (const target of [null, '//example.test', 'https://example.test', '/admin/../club', '/admin/sign-in', '/administrator', '/admin\\example.test']) {
    expect(safeAdminReturnPath(target)).toBe('/admin/sessions')
  }
})
