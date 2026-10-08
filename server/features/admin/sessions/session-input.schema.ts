import { z } from 'zod'
import { ApiError } from '../../../http/errors.ts'
import type { FieldErrorCode } from '../../../../shared/api/errors.ts'
import type { SessionInput } from '../../../../shared/api/admin-sessions.ts'
import { validateSessionFields } from '../../../../shared/session-rules.ts'
import { clubToday } from '../../../../shared/club-time.ts'
const text = z.string().nullable().optional()
// Domain rules assign stable field codes without coercing values at the JSON boundary.
const numeric = z.union([z.number(), z.string(), z.null()]).optional()
export const sessionInputSchema = z.strictObject({
  createRequestId: z.uuid(), classId: text, date: text, startTime: text,
  durationMinutes: numeric, levelId: text, venueId: text, coachIds: z.array(z.string()).nullable().optional(),
  priceIdr: numeric, minParticipants: numeric, maxParticipants: numeric,
})
export function parseSessionInput(body: unknown): SessionInput {
  const result = sessionInputSchema.safeParse(body)
  if (result.success) return result.data as SessionInput
  const values = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {}
  const fields = validateSessionFields(values, { today: clubToday(), now: new Date() }) as Record<string, FieldErrorCode>
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'body')
    fields[field] ??= values[field] === undefined || values[field] === null ? 'REQUIRED' : 'INVALID_FORMAT'
  }
  throw new ApiError(400, 'VALIDATION_FAILED', fields)
}
