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
  version: number
  isSample: boolean
}
// POST /api/admin/venues/map-location: what a pasted Google Maps link points at.
export interface MapLocationRequest { url: string }
export interface MapLocationResponse { mapUrl: string; latitude: number; longitude: number }
