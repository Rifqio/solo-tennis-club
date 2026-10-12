// Session albums (boards 9f, D12, 18, D13). Admins upload photos after a session; anyone can see and download them.
//
// Admin:  GET    /api/admin/sessions/:id/photos            → AdminAlbumResponse
//         POST   /api/admin/sessions/:id/photos            ← the image itself (image/jpeg, png or webp) → AdminSessionPhoto
//         PUT    /api/admin/sessions/:id/photos/cover      ← { photoId } → AdminAlbumResponse
//         POST   /api/admin/sessions/:id/photos/delete     ← { photoIds } → AdminAlbumResponse
//         POST   /api/admin/sessions/:id/photos/restore    ← { photoIds } → AdminAlbumResponse (Urungkan)
// Public: GET    /api/public/sessions/:id/photos           → PublicAlbumResponse
//         GET    /api/public/sessions/:id/photos.zip       → every photo in one zip file
//         GET    /api/public/albums?limit=                 → RecentAlbumsResponse

// The browser shrinks each photo to this long edge before it goes up, so a phone's 12 MP shot arrives near 1 MB.
export const SESSION_PHOTO_LONG_EDGE = 2048
// What the server accepts for one photo after shrinking (a photo the browser could not shrink is checked against this too).
export const SESSION_PHOTO_MAX_BYTES = 8 * 1024 * 1024
// A file the admin picks may be this big before shrinking; bigger ones are skipped with a note.
export const SESSION_PHOTO_PICK_MAX_BYTES = 40 * 1024 * 1024
export const SESSION_PHOTOS_MAX = 150
// How far back the admin's "upload the photos" reminder looks for a finished session without photos.
export const PHOTO_REMINDER_DAYS = 7

export interface SessionPhoto {
  id: string
  url: string
  width: number
  height: number
}

export interface AlbumSession {
  id: string
  className: string
  levelName: string
  venueName: string
  // WIB club date and times.
  date: string
  startTime: string
  endTime: string
  startsAt: string
  isSample: boolean
}

export interface AdminSessionPhoto extends SessionPhoto { isCover: boolean }

export interface AdminAlbumResponse {
  session: AlbumSession & { cancelled: boolean }
  // In album order; the cover is marked. Photos waiting for Urungkan are left out.
  photos: AdminSessionPhoto[]
  maxPhotos: number
}

export interface PublicAlbumResponse {
  session: AlbumSession
  photos: SessionPhoto[]
  // The thumbnail the admin chose, or the first photo.
  coverId: string | null
  // When the latest photo went up.
  updatedAt: string | null
}

export interface AlbumSummary {
  session: AlbumSession
  count: number
  cover: SessionPhoto
}

export interface RecentAlbumsResponse {
  albums: AlbumSummary[]
}

// For a member's booking: how many photos its session has and up to three to show.
export interface SessionPhotoPreview {
  count: number
  preview: SessionPhoto[]
}

export interface PhotoIdsInput { photoIds: string[] }
export interface CoverInput { photoId: string }
