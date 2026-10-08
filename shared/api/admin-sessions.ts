export interface SessionInput {
  createRequestId: string; classId: string; date: string; startTime: string; durationMinutes: number
  levelId: string; venueId: string; coachIds: string[]; priceIdr: number; minParticipants: number; maxParticipants: number
}
export interface SessionDefaults {
  levelId: string; venueId: string; durationMinutes: number; priceIdr: number
  minParticipants: number; maxParticipants: number; coachIds: string[]
}
export interface NamedOption { id: string; name: string }
export interface SessionOptions {
  classes: (NamedOption & { defaults: SessionDefaults })[]
  levels: NamedOption[]; venues: NamedOption[]; coaches: NamedOption[]
}
export interface AdminSessionDetail {
  id: string; version: number; classId: string; className: string; date: string; startTime: string; endTime: string
  startsAt: string; durationMinutes: number; levelId: string; levelName: string; venueId: string; venueName: string
  coaches: NamedOption[]; priceIdr: number; minParticipants: number; maxParticipants: number
  remainingPlaces: number; status: string; isSample: boolean
}
export interface CreateSessionResponse { session: AdminSessionDetail; replayed: boolean }
