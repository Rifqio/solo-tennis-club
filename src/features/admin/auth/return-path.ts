export function safeAdminReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/admin') || value.includes('\\')) return '/admin/sessions'
  try {
    const parsed = new URL(value, 'https://stc.invalid')
    if (parsed.origin !== 'https://stc.invalid' || !/^\/admin(?:\/|$)/.test(parsed.pathname) || parsed.pathname === '/admin/sign-in') return '/admin/sessions'
    return parsed.pathname + parsed.search + parsed.hash
  } catch { return '/admin/sessions' }
}
