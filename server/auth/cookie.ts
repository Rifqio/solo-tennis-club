export const ADMIN_COOKIE = 'lafu_admin'
export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = Object.create(null)
  for (const pair of (header ?? '').split(';')) {
    const index = pair.indexOf('=')
    if (index < 1) continue
    try { cookies[pair.slice(0, index).trim()] = decodeURIComponent(pair.slice(index + 1).trim()) } catch { /* Malformed cookies are ignored. */ }
  }
  return cookies
}
export function serializeSessionCookie(token: string, { secure, expiresAt }: { secure: boolean; expiresAt: Date }): string {
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Expires=${expiresAt.toUTCString()}; Max-Age=${Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))}${secure ? '; Secure' : ''}`
}
export function clearSessionCookie(secure = true) { return serializeSessionCookie('', { secure, expiresAt: new Date(0) }) }
