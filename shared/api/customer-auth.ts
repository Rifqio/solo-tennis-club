export interface CustomerIdentity {
  id: string
  displayName: string
  phone: string
}

export interface CustomerSessionResponse {
  customer: CustomerIdentity
  csrfToken: string
  expiresAt: string
}

export interface OtpChallengeResponse {
  challengeId: string
  maskedPhone: string
  expiresAt: string
  resendAt: string
  serverNow: string
  development?: true
  debugCode?: string
}

export type OtpVerificationResponse =
  | { next: 'complete'; session: CustomerSessionResponse }
  | { next: 'name'; csrfToken: string; expiresAt: string }
