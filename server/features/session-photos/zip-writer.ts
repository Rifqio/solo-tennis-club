import { crc32 } from 'node:zlib'
import type { Writable } from 'node:stream'

// A minimal zip writer for "Unduh semua": photos are already compressed, so each file is stored as is (method 0).
// Files are written one at a time, so memory holds one photo, not the album. No zip64: an album stays far below 4 GB.

export interface ZipEntry { name: string; bytes: Buffer; modified: Date }

function dosTime(date: Date) {
  return ((date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)) & 0xffff
}
function dosDate(date: Date) {
  return (((Math.max(1980, date.getFullYear()) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff
}

function write(out: Writable, chunk: Buffer) {
  return new Promise<void>((resolve, reject) => {
    out.write(chunk, error => error ? reject(error) : resolve())
  })
}

export async function writeZip(out: Writable, entries: AsyncIterable<ZipEntry> | Iterable<ZipEntry>) {
  const central: Buffer[] = []
  let offset = 0
  let count = 0
  for await (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const checksum = crc32(entry.bytes)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6) // UTF-8 names
    local.writeUInt16LE(0, 8)
    local.writeUInt16LE(dosTime(entry.modified), 10)
    local.writeUInt16LE(dosDate(entry.modified), 12)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(entry.bytes.length, 18)
    local.writeUInt32LE(entry.bytes.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    await write(out, Buffer.concat([local, name]))
    await write(out, entry.bytes)

    const header = Buffer.alloc(46)
    header.writeUInt32LE(0x02014b50, 0)
    header.writeUInt16LE(20, 4)
    header.writeUInt16LE(20, 6)
    header.writeUInt16LE(0x0800, 8)
    header.writeUInt16LE(0, 10)
    header.writeUInt16LE(dosTime(entry.modified), 12)
    header.writeUInt16LE(dosDate(entry.modified), 14)
    header.writeUInt32LE(checksum, 16)
    header.writeUInt32LE(entry.bytes.length, 20)
    header.writeUInt32LE(entry.bytes.length, 24)
    header.writeUInt16LE(name.length, 28)
    header.writeUInt32LE(offset, 42)
    central.push(header, name)
    offset += 30 + name.length + entry.bytes.length
    count++
  }
  const directory = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(count, 8)
  end.writeUInt16LE(count, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  await write(out, Buffer.concat([directory, end]))
}
