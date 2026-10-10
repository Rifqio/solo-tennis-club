export type ReferenceKind = 'coach' | 'venue' | 'level'
export interface ReferenceInput {
  createRequestId?: string
  name: string
  address?: string | null
  // Venues only: the admin's Google Maps link and the pin it points at. All three or none.
  mapUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  version?: number
}
export interface ReferenceRecord {
  id: string
  kind: ReferenceKind
  name: string
  address: string | null
  mapUrl: string | null
  latitude: number | null
  longitude: number | null
  // Coaches only: the portrait path, or null for initials.
  photoUrl: string | null
  // How many classes use it by default (coach, level or venue of the class).
  classCount: number
  // Archived records leave lists and pickers but stay on the classes and sessions that already use them.
  archived: boolean
  version: number
  isSample: boolean
}
// GET /api/admin/{coaches|venues|levels}/:id/usage: the classes that use it, each with its next scheduled session.
export interface ReferenceUsage {
  classes: { id: string; name: string; levelName: string; venueName: string; durationMinutes: number; nextSessionAt: string | null }[]
}
// GET /api/admin/reference-counts: active records per list, for the Kelola tabs.
export interface ReferenceCounts { coach: number; venue: number; level: number }
// POST /api/admin/{coaches|venues|levels}/:id/archive and /restore.
export interface ArchiveInput { version: number }
// PUT /api/admin/coaches/:id/photo takes the image itself (JPEG, PNG or WebP, at most 5 MB) as the body.
export const COACH_PHOTO_MAX_BYTES = 5 * 1024 * 1024
// POST /api/admin/venues/map-location: what a pasted Google Maps link points at.
export interface MapLocationRequest { url: string }
export interface MapLocationResponse { mapUrl: string; latitude: number; longitude: number }
