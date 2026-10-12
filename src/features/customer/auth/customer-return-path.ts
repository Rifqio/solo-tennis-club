import { isClubDate } from '@shared/club-time'

export function safeCustomerReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.includes('\\')) return '/'
  try {
    const url = new URL(value, 'https://stc.invalid')
    if (url.origin !== 'https://stc.invalid') return '/'
    if (url.pathname === '/club') return '/'
    // The member's own screens, opened again after signing in.
    if (url.pathname === '/account' || url.pathname === '/bookings') return url.pathname
    const booking = /^\/book\/([a-z0-9]{1,64})$/.exec(url.pathname)
    if (booking) {
      const params = new URLSearchParams()
      const date = url.searchParams.get('date')
      const quantity = url.searchParams.get('quantity')
      if (isClubDate(date)) params.set('date', date)
      if (quantity && /^[1-9]\d{0,3}$/.test(quantity)) params.set('quantity', quantity)
      return `/book/${booking[1]}${params.size ? `?${params}` : ''}`
    }
    // The schedule lives at /schedule; /?date=… is the address it had before the club page became home.
    if (url.pathname !== '/schedule' && !(url.pathname === '/' && (url.searchParams.has('date') || url.searchParams.has('session')))) return '/'
    const params = new URLSearchParams()
    const date = url.searchParams.get('date')
    const session = url.searchParams.get('session')
    if (isClubDate(date)) params.set('date', date)
    if (session && /^[a-z0-9]{1,64}$/.test(session)) params.set('session', session)
    return params.size ? '/schedule?' + params.toString() : '/schedule'
  } catch {
    return '/'
  }
}
