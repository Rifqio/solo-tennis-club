export interface SignInRequest { email: string; password: string }
export interface AdminSessionInfo {
  admin: { email: string; displayName: string }
  csrfToken: string
  expiresAt: string
}
