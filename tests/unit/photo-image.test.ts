import { describe, expect, it } from 'vitest'
import { photoSize, sniffPhoto } from '../../server/features/session-photos/photo-image.ts'

// A JPEG with an optional EXIF orientation, then a baseline start-of-frame carrying the stored size.
function jpeg(width: number, height: number, orientation?: number) {
  const parts = [Buffer.from([0xff, 0xd8])]
  if (orientation) {
    const tiff = Buffer.alloc(26)
    tiff.write('MM', 0, 'ascii')
    tiff.writeUInt16BE(42, 2)
    tiff.writeUInt32BE(8, 4)
    tiff.writeUInt16BE(1, 8)
    tiff.writeUInt16BE(0x0112, 10)
    tiff.writeUInt16BE(3, 12)
    tiff.writeUInt32BE(1, 14)
    tiff.writeUInt16BE(orientation, 18)
    const body = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiff])
    const head = Buffer.from([0xff, 0xe1, 0, 0])
    head.writeUInt16BE(body.length + 2, 2)
    parts.push(head, body)
  }
  const sof = Buffer.from([0xff, 0xc0, 0, 17, 8, 0, 0, 0, 0, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1])
  sof.writeUInt16BE(height, 5)
  sof.writeUInt16BE(width, 7)
  parts.push(sof, Buffer.from([0xff, 0xd9]))
  return Buffer.concat(parts)
}

describe('photo size from the file header', () => {
  it('reads a JPEG and swaps the sides when EXIF turns it a quarter', () => {
    const plain = jpeg(4000, 3000)
    expect(photoSize(plain, sniffPhoto(plain)!)).toEqual({ width: 4000, height: 3000 })
    const turned = jpeg(4000, 3000, 6)
    expect(photoSize(turned, sniffPhoto(turned)!)).toEqual({ width: 3000, height: 4000 })
    const upsideDown = jpeg(4000, 3000, 3)
    expect(photoSize(upsideDown, sniffPhoto(upsideDown)!)).toEqual({ width: 4000, height: 3000 })
  })

  it('reads lossy and extended WebP', () => {
    const lossy = Buffer.alloc(40)
    lossy.write('RIFF', 0, 'ascii'); lossy.write('WEBP', 8, 'ascii'); lossy.write('VP8 ', 12, 'ascii')
    lossy.writeUInt16LE(1200, 26); lossy.writeUInt16LE(900, 28)
    expect(photoSize(lossy, sniffPhoto(lossy)!)).toEqual({ width: 1200, height: 900 })
    const extended = Buffer.alloc(40)
    extended.write('RIFF', 0, 'ascii'); extended.write('WEBP', 8, 'ascii'); extended.write('VP8X', 12, 'ascii')
    extended.writeUIntLE(1599, 24, 3); extended.writeUIntLE(1199, 27, 3)
    expect(photoSize(extended, sniffPhoto(extended)!)).toEqual({ width: 1600, height: 1200 })
  })

  it('refuses what is not a photo', () => {
    expect(sniffPhoto(Buffer.from('%PDF-1.7'))).toBeNull()
    expect(sniffPhoto(Buffer.from('GIF89a'))).toBeNull()
  })
})
