export interface RuntimeConfig { cookieSecure: boolean; publicOrigin?: string; trustProxy: boolean }
export function readRuntimeConfig(mode: 'development' | 'production'): RuntimeConfig {
  const host = process.env.LAFU_HOST ?? '127.0.0.1'
  const loopback = ['127.0.0.1', 'localhost', '::1'].includes(host)
  const publicOrigin = process.env.LAFU_PUBLIC_ORIGIN
  if (publicOrigin && new URL(publicOrigin).origin !== publicOrigin) throw new Error('LAFU_PUBLIC_ORIGIN must be an origin')
  return { cookieSecure: mode === 'production' && !(process.env.LAFU_COOKIE_SECURE === 'false' && loopback), publicOrigin, trustProxy: process.env.LAFU_TRUST_PROXY === '1' }
}
