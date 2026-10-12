// What a photo file is and how big it is, read from its own bytes, never from its name or the declared type.

export type PhotoKind = { extension: 'jpg' | 'png' | 'webp'; contentType: 'image/jpeg' | 'image/png' | 'image/webp' }

export function sniffPhoto(bytes: Buffer): PhotoKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: 'jpg', contentType: 'image/jpeg' }
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { extension: 'png', contentType: 'image/png' }
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return { extension: 'webp', contentType: 'image/webp' }
  return null
}

// A JPEG's size sits in its first start-of-frame segment (SOF0 to SOF15, except the DHT, JPG and DAC markers).
function jpegSize(bytes: Buffer) {
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null
    const marker = bytes[offset + 1]
    if (marker === 0xff) { offset += 1; continue }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue }
    const length = bytes.readUInt16BE(offset + 2)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5), orientation: jpegOrientation(bytes) }
    }
    offset += 2 + length
  }
  return null
}

// The EXIF orientation (1 to 8) of a JPEG, or 1. Orientations 5 to 8 turn the picture a quarter, so the browser shows
// it with width and height swapped.
function jpegOrientation(bytes: Buffer) {
  let offset = 2
  while (offset + 4 < bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1]
    const length = bytes.readUInt16BE(offset + 2)
    if (marker === 0xe1 && bytes.subarray(offset + 4, offset + 10).toString('binary') === 'Exif\0\0') {
      const tiff = offset + 10
      const little = bytes.subarray(tiff, tiff + 2).toString('ascii') === 'II'
      const u16 = (at: number) => little ? bytes.readUInt16LE(at) : bytes.readUInt16BE(at)
      const u32 = (at: number) => little ? bytes.readUInt32LE(at) : bytes.readUInt32BE(at)
      if (tiff + 8 > bytes.length) return 1
      const directory = tiff + u32(tiff + 4)
      if (directory + 2 > bytes.length) return 1
      const entries = u16(directory)
      for (let index = 0; index < entries; index++) {
        const entry = directory + 2 + index * 12
        if (entry + 12 > bytes.length) return 1
        if (u16(entry) === 0x0112) { const value = u16(entry + 8); return value >= 1 && value <= 8 ? value : 1 }
      }
      return 1
    }
    if (marker === 0xda) return 1
    offset += 2 + length
  }
  return 1
}

function webpSize(bytes: Buffer) {
  const chunk = bytes.subarray(12, 16).toString('ascii')
  if (chunk === 'VP8X' && bytes.length >= 30) return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) }
  if (chunk === 'VP8L' && bytes.length >= 25) {
    const bits = bytes.readUInt32LE(21)
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) }
  }
  if (chunk === 'VP8 ' && bytes.length >= 30) return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff }
  return null
}

// The size the photo is shown at: a JPEG turned by its EXIF orientation reports its sides swapped.
export function photoSize(bytes: Buffer, kind: PhotoKind): { width: number; height: number } | null {
  let size: { width: number; height: number } | null = null
  if (kind.extension === 'png' && bytes.length >= 24) size = { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
  else if (kind.extension === 'webp') size = webpSize(bytes)
  else if (kind.extension === 'jpg') {
    const jpeg = jpegSize(bytes)
    size = jpeg && (jpeg.orientation >= 5 ? { width: jpeg.height, height: jpeg.width } : { width: jpeg.width, height: jpeg.height })
  }
  return size && size.width > 0 && size.height > 0 ? size : null
}
