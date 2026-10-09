import type { ApiErrorBody, ApiErrorCode, FieldErrorCode } from '@shared/api/errors'

export type AdminResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'http'; status: number; code: ApiErrorCode; fields?: Record<string, FieldErrorCode>; latest?: unknown; retryAfterSeconds?: number }
  | { kind: 'network' }
  | { kind: 'aborted' }

interface AdminRequestOptions {
  signal?: AbortSignal
  csrfToken?: string
  onUnauthenticated?: () => void
}

async function request<T>(method: string, path: string, body: unknown, options: AdminRequestOptions): Promise<AdminResult<T>> {
  // Never send in-memory admin credentials to a caller-supplied external URL.
  const parsedPath = new URL(path, 'https://lafu.invalid')
  if (!path.startsWith('/api/admin/') || path.includes('\\') || parsedPath.origin !== 'https://lafu.invalid' || !parsedPath.pathname.startsWith('/api/admin/')) throw new Error('Admin API path required')
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (options.csrfToken) headers['X-CSRF-Token'] = options.csrfToken
    const response = await fetch(path, {
      method, credentials: 'same-origin', cache: 'no-store', headers,
      signal: options.signal, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    if (!response.ok) {
      let error: ApiErrorBody['error'] = { code: 'INTERNAL' }
      try { error = (await response.json() as ApiErrorBody).error ?? error } catch { /* Proxies may return non-JSON errors. */ }
      if (response.status === 401) options.onUnauthenticated?.()
      return { kind: 'http', status: response.status, ...error }
    }
    return { kind: 'ok', data: response.status === 204 ? undefined as T : await response.json() as T }
  } catch (error) {
    if (options.signal?.aborted || (error instanceof Error && error.name === 'AbortError')) return { kind: 'aborted' }
    return { kind: 'network' }
  }
}

export function adminGet<T>(path: string, options: AdminRequestOptions = {}) {
  return request<T>('GET', path, undefined, options)
}
export function adminSend<T>(method: 'POST' | 'PUT', path: string, body: unknown, options: AdminRequestOptions = {}) {
  return request<T>(method, path, body, options)
}
