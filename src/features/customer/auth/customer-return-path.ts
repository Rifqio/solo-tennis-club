import { isClubDate } from '@shared/club-time'

export function safeCustomerReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.includes('\\')) return '/'
  try {
    const url = new URL(value, 'https://lafu.invalid')
    if (url.origin !== 'https://lafu.invalid') return '/'
    if (url.pathname === '/club') return '/club'
    const booking = /^\/book\/([a-z0-9]{1,64})$/.exec(url.pathname)
    if (booking) {
      const params = new URLSearchParams()
      const date = url.searchParams.get('date')
      const quantity = url.searchParams.get('quantity')
      if (isClubDate(date)) params.set('date', date)
      if (quantity && /^[1-9]\d{0,3}$/.test(quantity)) params.set('quantity', quantity)
      return `/book/${booking[1]}${params.size ? `?${params}` : ''}`
    }
    if (url.pathname !== '/') return '/'
    const params = new URLSearchParams()
    const date = url.searchParams.get('date')
    const session = url.searchParams.get('session')
    if (isClubDate(date)) params.set('date', date)
    if (session && /^[a-z0-9]{1,64}$/.test(session)) params.set('session', session)
    return params.size ? '/?' + params.toString() : '/'
  } catch {
    return '/'
  }
}
