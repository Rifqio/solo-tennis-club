import type { ApiErrorBody, ApiErrorCode } from '@shared/api/errors'
export type ApiResult<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'http'; status: number; code: ApiErrorCode }
  | { kind: 'network' }
  | { kind: 'aborted' }
export async function getJson<T>(path: string, options: { signal?: AbortSignal } = {}): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: options.signal })
    if (!response.ok) {
      let code: ApiErrorCode = 'INTERNAL'
      try { const body = await response.json() as ApiErrorBody; code = body.error?.code ?? 'INTERNAL' } catch { /* A proxy may return HTML rather than the application error contract. */ }
      return { kind: 'http', status: response.status, code }
    }
    return { kind: 'ok', data: await response.json() as T }
  } catch (error) {
    if (options.signal?.aborted || (error instanceof Error && error.name === 'AbortError')) return { kind: 'aborted' }
    return { kind: 'network' }
  }
}
