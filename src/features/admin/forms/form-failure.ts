import type { ApiErrorCode, FieldErrorCode } from '@shared/api/errors'

// Whether a failed save also gets a panel in the form. Not when every problem is on a field (the fields say it, G1:
// one feedback per outcome), nor when the admin's session ended (the sign-in screen says it, and the form must not
// still show it after signing back in).
export function failureNeedsPanel(code: ApiErrorCode, fields?: Record<string, FieldErrorCode>) {
  if (code === 'UNAUTHENTICATED') return false
  return !(code === 'VALIDATION_FAILED' && fields && Object.keys(fields).length > 0)
}
