import type { AlbumSession } from './session-photos.ts'

export interface SessionInput {
  createRequestId: string; classId: string; date: string; startTime: string; durationMinutes: number
  levelId: string; venueId: string; coachIds: string[]; priceIdr: number; minParticipants: number; maxParticipants: number
}
export interface SessionDefaults {
  levelId: string; venueId: string; durationMinutes: number; priceIdr: number
  minParticipants: number; maxParticipants: number; coachIds: string[]
}
// `archived`: still shown where it is already chosen, hidden from new picks.
export interface NamedOption { id: string; name: string; archived?: boolean }
// A coach for the photo-card picker: portrait (null shows initials) and how many classes use them by default.
export interface CoachOption extends NamedOption { photoUrl: string | null; classCount: number }
// Venues show their address and whether a Maps pin is saved in the desktop class editor.
export interface VenueOption extends NamedOption { address: string | null; hasPin: boolean }
export interface SessionOptions {
  classes: (NamedOption & { defaults: SessionDefaults })[]
  levels: NamedOption[]; venues: VenueOption[]; coaches: CoachOption[]
}
export interface AdminSessionDetail {
  id: string; version: number; classId: string; className: string; date: string; startTime: string; endTime: string
  startsAt: string; durationMinutes: number; levelId: string; levelName: string; venueId: string; venueName: string
  coaches: NamedOption[]; priceIdr: number; minParticipants: number; maxParticipants: number
  remainingPlaces: number; status: string; isSample: boolean
}
export interface CreateSessionResponse { session: AdminSessionDetail; replayed: boolean }
export interface UpdateSessionInput extends Omit<SessionInput, 'createRequestId'> { version: number }

export interface AdminSessionListResponse {
  today: string; date: string | null; minDate: string; maxDate: string; nextDate: string | null
  sessions: AdminSessionDetail[]; truncated: boolean
  // Scheduled (not cancelled) sessions per club date across minDate..maxDate, for the date strip. Days without any are left out.
  dayCounts: Record<string, number>
  // The newest session that finished in the last week without photos: the reminder card above the day (boards 10, D5).
  photoReminder: AlbumSession | null
}
