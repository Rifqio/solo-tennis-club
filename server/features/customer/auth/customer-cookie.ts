export const CUSTOMER_COOKIE = 'lafu_customer'
export const OTP_FLOW_COOKIE = 'lafu_otp_flow'
export const PROFILE_COOKIE = 'lafu_customer_profile'

export function serializeCustomerCookie(name: string, token: string, expiresAt: Date, secure: boolean): string {
  return `${name}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/api/customer; Expires=${expiresAt.toUTCString()}${secure ? '; Secure' : ''}`
}

export function clearCustomerCookie(name: string, secure: boolean): string {
  return serializeCustomerCookie(name, '', new Date(0), secure) + '; Max-Age=0'
}
