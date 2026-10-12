import { setting } from './setting.ts'
export interface RuntimeConfig { cookieSecure: boolean; publicOrigin?: string; trustProxy: boolean; developmentMode?: boolean; developmentOrigins?: string[]; otpDriver?: 'mock' | 'disabled'; demo?: boolean }
export function readRuntimeConfig(mode: 'development' | 'production'): RuntimeConfig {
  const host = setting('HOST') ?? '127.0.0.1'
  const loopback = ['127.0.0.1', 'localhost', '::1'].includes(host)
  const publicOrigin = setting('PUBLIC_ORIGIN')
  if (publicOrigin && new URL(publicOrigin).origin !== publicOrigin) throw new Error('STC_PUBLIC_ORIGIN must be an origin')
  // The hosted portfolio demo (STC_DEMO=1) keeps the mock OTP and the admin demo sign-in; nothing else turns them on.
  const demo = setting('DEMO') === '1'
  const otpDriver = setting('OTP_DRIVER') ?? (mode === 'development' || demo ? 'mock' : 'disabled')
  if (otpDriver !== 'mock' && otpDriver !== 'disabled') throw new Error('Unsupported STC_OTP_DRIVER')
  if (mode === 'production' && otpDriver === 'mock' && !demo) throw new Error('Mock OTP cannot run in production unless STC_DEMO=1')
  return { cookieSecure: mode === 'production' && !(setting('COOKIE_SECURE') === 'false' && loopback), publicOrigin, trustProxy: setting('TRUST_PROXY') === '1', developmentMode: mode === 'development', otpDriver, demo }
}
