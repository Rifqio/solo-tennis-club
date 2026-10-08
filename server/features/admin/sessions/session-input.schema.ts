import { z } from 'zod'
import { ApiError } from '../../../http/errors.ts'
import type { FieldErrorCode } from '../../../../shared/api/errors.ts'
export const sessionInputSchema = z.strictObject({
  createRequestId: z.uuid(), classId: z.string().min(1), date: z.iso.date(), startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  durationMinutes: z.number().int().min(15).max(720), levelId: z.string().min(1), venueId: z.string().min(1), coachIds: z.array(z.string().min(1)).min(1),
  priceIdr: z.number().int().min(0).max(100000000), minParticipants: z.number().int().min(1).max(500), maxParticipants: z.number().int().min(1).max(500),
})
export function parseSessionInput(body: unknown) {
  const result = sessionInputSchema.safeParse(body)
  if (result.success) return result.data
  const fields: Record<string, FieldErrorCode> = {}
  for (const issue of result.error.issues) fields[String(issue.path[0] ?? 'body')] = 'INVALID_FORMAT'
  throw new ApiError(400, 'VALIDATION_FAILED', fields)
}
