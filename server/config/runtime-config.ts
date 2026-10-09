export interface RuntimeConfig { cookieSecure: boolean; publicOrigin?: string; trustProxy: boolean; developmentMode?: boolean; developmentOrigins?: string[]; otpDriver?: 'mock' | 'disabled' }
export function readRuntimeConfig(mode: 'development' | 'production'): RuntimeConfig {
  const host = process.env.LAFU_HOST ?? '127.0.0.1'
  const loopback = ['127.0.0.1', 'localhost', '::1'].includes(host)
  const publicOrigin = process.env.LAFU_PUBLIC_ORIGIN
  if (publicOrigin && new URL(publicOrigin).origin !== publicOrigin) throw new Error('LAFU_PUBLIC_ORIGIN must be an origin')
  const otpDriver = process.env.LAFU_OTP_DRIVER ?? (mode === 'development' ? 'mock' : 'disabled')
  if (otpDriver !== 'mock' && otpDriver !== 'disabled') throw new Error('Unsupported LAFU_OTP_DRIVER')
  if (mode === 'production' && otpDriver === 'mock') throw new Error('Mock OTP cannot run in production')
  return { cookieSecure: mode === 'production' && !(process.env.LAFU_COOKIE_SECURE === 'false' && loopback), publicOrigin, trustProxy: process.env.LAFU_TRUST_PROXY === '1', developmentMode: mode === 'development', otpDriver }
}
