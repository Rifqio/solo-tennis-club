import type { APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import type { AdminSessionInfo } from '../../../shared/api/admin-auth.ts'
import type { SessionOptions, SessionInput, CreateSessionResponse } from '../../../shared/api/admin-sessions.ts'
import { clubToday, addClubDays } from '../../../shared/club-time.ts'
import { e2eAdminEmail, e2eAdminPassword } from './e2e-credentials.ts'
const origin = 'http://127.0.0.1:4310'
export async function signInAdmin(request: APIRequestContext): Promise<AdminSessionInfo> {
  const response = await request.post('/api/admin/auth/sign-in', { headers: { Origin: origin }, data: { email: e2eAdminEmail, password: e2eAdminPassword } })
  if (!response.ok()) throw new Error('E2E sign-in failed')
  return response.json()
}
export async function getSessionOptions(request: APIRequestContext): Promise<SessionOptions> {
  const response = await request.get('/api/admin/session-options')
  if (!response.ok()) throw new Error('E2E options failed')
  return response.json()
}
export async function publishSession(request: APIRequestContext, auth: AdminSessionInfo, partialInput: Partial<SessionInput> = {}): Promise<CreateSessionResponse> {
  const options = await getSessionOptions(request)
  const response = await request.post('/api/admin/sessions', { headers: { Origin: origin, 'X-CSRF-Token': auth.csrfToken }, data: { createRequestId: randomUUID(), classId: options.classes[0].id, date: addClubDays(clubToday(), 7), startTime: '19:30', ...options.classes[0].defaults, ...partialInput } })
  if (!response.ok()) throw new Error('E2E publication failed')
  return response.json()
}
