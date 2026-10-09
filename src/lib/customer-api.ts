import type { ApiErrorBody } from '@shared/api/errors'

export class CustomerApiError extends Error {
  status: number
  detail: ApiErrorBody['error']
  constructor(status: number, detail: ApiErrorBody['error']) {
    super(detail.code)
    this.status = status
    this.detail = detail
  }
}

export async function customerRequest<T>(
  path: string,
  options: { body?: unknown; csrfToken?: string; signal?: AbortSignal } = {},
): Promise<T> {
  const parsed = new URL(path, 'https://lafu.invalid')
  if (!path.startsWith('/api/customer/') || path.includes('\\') || parsed.origin !== 'https://lafu.invalid'
    || !parsed.pathname.startsWith('/api/customer/')) throw new Error('Customer API path required')

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.csrfToken) headers['X-CSRF-Token'] = options.csrfToken
  const response = await fetch(path, {
    method: options.body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers,
    signal: options.signal,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  })
  if (!response.ok) {
    let detail: ApiErrorBody['error'] = { code: 'INTERNAL' }
    try { detail = (await response.json() as ApiErrorBody).error ?? detail } catch { /* A reverse proxy may return HTML. */ }
    throw new CustomerApiError(response.status, detail)
  }
  return response.status === 204 ? undefined as T : await response.json() as T
}
