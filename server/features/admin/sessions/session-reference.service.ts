import type { Database } from '../../../database/transaction.ts'
import type { FieldErrorCode } from '../../../../shared/api/errors.ts'
import type { SessionInput, UpdateSessionInput } from '../../../../shared/api/admin-sessions.ts'
import { ApiError } from '../../../http/errors.ts'
import { createClassRepository } from '../classes/class.repository.ts'
import { createReferenceRepository } from '../references/reference.repository.ts'

export async function validateSessionReferences(database: Database, input: SessionInput | UpdateSessionInput) {
  const fields: Record<string, FieldErrorCode> = {}
  const classes = createClassRepository(database)
  const levels = createReferenceRepository(database, 'level')
  const venues = createReferenceRepository(database, 'venue')
  const coaches = createReferenceRepository(database, 'coach')

  if (!await classes.findById(input.classId)) fields.classId = 'REFERENCE_NOT_FOUND'
  if (!await levels.findById(input.levelId)) fields.levelId = 'REFERENCE_NOT_FOUND'
  if (!await venues.findById(input.venueId)) fields.venueId = 'REFERENCE_NOT_FOUND'
  if (await coaches.countByIds(input.coachIds) !== input.coachIds.length) {
    fields.coachIds = 'REFERENCE_NOT_FOUND'
  }
  if (Object.keys(fields).length) throw new ApiError(400, 'VALIDATION_FAILED', fields)
}
