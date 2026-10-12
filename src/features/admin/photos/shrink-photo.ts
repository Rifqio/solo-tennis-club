import { SESSION_PHOTO_LONG_EDGE, SESSION_PHOTO_MAX_BYTES, SESSION_PHOTO_PICK_MAX_BYTES } from '@shared/api/session-photos'

export type ShrinkResult =
  | { kind: 'ok'; blob: Blob; width: number; height: number }
  | { kind: 'skip'; reason: 'not-photo' | 'too-big' | 'unreadable' }

const SENDABLE = ['image/jpeg', 'image/png', 'image/webp']

// Phone photos are 3 to 12 MB; the album needs about 2048 px on the long edge. The browser redraws each photo at that
// size (turned upright by its EXIF orientation) and sends a JPEG near 1 MB, so uploads are quick on mobile data.
// A photo the browser cannot read (HEIC on most browsers) is skipped with a note instead of failing on the server.
export async function shrinkPhoto(file: File): Promise<ShrinkResult> {
  if (file.type && !file.type.startsWith('image/')) return { kind: 'skip', reason: 'not-photo' }
  if (file.size > SESSION_PHOTO_PICK_MAX_BYTES) return { kind: 'skip', reason: 'too-big' }
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return { kind: 'skip', reason: file.type.startsWith('image/') || !file.type ? 'unreadable' : 'not-photo' }
  }
  try {
    const { width, height } = bitmap
    const scale = Math.min(1, SESSION_PHOTO_LONG_EDGE / Math.max(width, height))
    // Small enough already, and a type the server takes: send the file untouched.
    if (scale === 1 && file.size <= 1_500_000 && SENDABLE.includes(file.type)) return { kind: 'ok', blob: file, width, height }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const context = canvas.getContext('2d')
    if (!context) return { kind: 'skip', reason: 'unreadable' }
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86))
    if (!blob) return { kind: 'skip', reason: 'unreadable' }
    if (blob.size > SESSION_PHOTO_MAX_BYTES) return { kind: 'skip', reason: 'too-big' }
    return { kind: 'ok', blob, width: canvas.width, height: canvas.height }
  } finally {
    bitmap.close()
  }
}
