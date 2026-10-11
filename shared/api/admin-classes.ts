import type { NamedOption } from './admin-sessions.ts'
export interface ClassInput {
  createRequestId?: string; version?: number; name: string; defaultLevelId: string; defaultVenueId: string
  defaultDurationMinutes: number; defaultPriceIdr: number; defaultMinParticipants: number; defaultMaxParticipants: number; defaultCoachIds: string[]
}
export interface ClassRecord extends ClassInput { id: string; version: number; levelName: string; venueName: string; coaches: (NamedOption & { photoUrl: string | null })[]; isSample: boolean }
