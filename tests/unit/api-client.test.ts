import { afterEach, expect, test, vi } from 'vitest'
import { getJson } from '../../src/lib/api.ts'

afterEach(() => vi.unstubAllGlobals())
test('200 JSON returns data with same-origin credentials and JSON accept header', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ sessions: [] }))
  vi.stubGlobal('fetch', fetch)
  expect(await getJson('/api/public/schedule')).toEqual({ kind: 'ok', data: { sessions: [] } })
  expect(fetch).toHaveBeenCalledWith('/api/public/schedule', expect.objectContaining({ credentials: 'same-origin', headers: { Accept: 'application/json' } }))
})
test('400 INVALID_DATE preserves the HTTP status and error code', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: { code: 'INVALID_DATE' } }, { status: 400 })))
  expect(await getJson('/api/public/schedule')).toEqual({ kind: 'http', status: 400, code: 'INVALID_DATE' })
})
test('rejected fetch returns a network result', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
  expect(await getJson('/api/public/schedule')).toEqual({ kind: 'network' })
})
test('an aborted signal returns aborted', async () => {
  const controller = new AbortController()
  controller.abort()
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')))
  expect(await getJson('/api/public/schedule', { signal: controller.signal })).toEqual({ kind: 'aborted' })
})
test('502 HTML maps to INTERNAL without leaking proxy content', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>bad gateway</html>', { status: 502 })))
  expect(await getJson('/api/public/schedule')).toEqual({ kind: 'http', status: 502, code: 'INTERNAL' })
})
