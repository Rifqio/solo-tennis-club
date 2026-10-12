import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'
import { del, get, list, put } from '@vercel/blob'

// Where uploaded files live. Keys are relative paths such as "sessions/<id>/<random>.webp"; each feature checks its
// own key shape before it gets here. Locally the files sit beside the database; the hosted demo keeps them in
// Vercel Blob, a public store for portraits and session photos and a private store for payment proofs.
export interface FileStore {
  readonly kind: 'disk' | 'blob'
  put(key: string, bytes: Buffer, contentType: string): Promise<void>
  read(key: string): Promise<Buffer | null>
  remove(keys: string[]): Promise<void>
  // Every stored key under a folder such as "sessions/" (used by the demo reset).
  list(prefix: string): Promise<string[]>
  // The address a browser can load a public file from, or null when this app serves it itself.
  publicUrl(key: string): string | null
}

export interface FileStores { publicFiles: FileStore; privateFiles: FileStore }

const keyPattern = /^[a-z0-9]+(?:\/[a-z0-9]+)*\/[a-z0-9-]+\.[a-z0-9]+$/

function checkKey(key: string) {
  if (!keyPattern.test(key)) throw new Error('Invalid storage key')
  return key
}

export function createDiskStore(dir: string): FileStore {
  const pathOf = (key: string) => {
    const root = resolve(dir)
    const path = resolve(root, checkKey(key))
    if (!path.startsWith(root + sep)) throw new Error('Storage key escapes its folder')
    return path
  }
  return {
    kind: 'disk',
    // Written under a temporary name and renamed into place, so a half-written file is never read or served.
    async put(key, bytes) {
      const path = pathOf(key)
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(`${path}.part`, bytes, { flag: 'wx' })
      renameSync(`${path}.part`, path)
    },
    async read(key) {
      return readFile(pathOf(key)).catch(() => null)
    },
    async remove(keys) {
      for (const key of keys) {
        const path = pathOf(key)
        rmSync(path, { force: true })
        rmSync(`${path}.part`, { force: true })
      }
    },
    async list(prefix) {
      const root = resolve(dir, prefix)
      if (!existsSync(root)) return []
      return readdirSync(root, { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile())
        .map(entry => relative(resolve(dir), resolve(entry.parentPath, entry.name)).split(sep).join('/'))
        .filter(key => keyPattern.test(key))
    },
    publicUrl: () => null,
  }
}

// The store id sits in the read-write token (vercel_blob_rw_<storeId>_<secret>); public files are served from it.
function blobStoreId(token: string) {
  const [, , , storeId = ''] = token.split('_')
  if (!/^[a-zA-Z0-9]+$/.test(storeId)) throw new Error('Unrecognised Vercel Blob token')
  return storeId.toLowerCase()
}

export function createBlobStore({ access, token }: { access: 'public' | 'private'; token: string }): FileStore {
  const base = `https://${blobStoreId(token)}.${access}.blob.vercel-storage.com/`
  return {
    kind: 'blob',
    async put(key, bytes, contentType) {
      await put(checkKey(key), bytes, { access, token, contentType, addRandomSuffix: false, allowOverwrite: false })
    },
    async read(key) {
      const result = await get(checkKey(key), { access, token, useCache: false })
      if (!result || result.statusCode !== 200 || !result.stream) return null
      return Buffer.from(await new Response(result.stream).arrayBuffer())
    },
    async remove(keys) {
      if (keys.length) await del(keys.map(checkKey), { token })
    },
    async list(prefix) {
      const keys: string[] = []
      let cursor: string | undefined
      do {
        const page = await list({ prefix, token, cursor, limit: 1000 })
        keys.push(...page.blobs.map(blob => blob.pathname))
        cursor = page.hasMore ? page.cursor : undefined
      } while (cursor)
      return keys
    },
    publicUrl: key => access === 'public' ? base + checkKey(key) : null,
  }
}

// Blob when its tokens are set (the hosted demo), otherwise folders beside the database.
export function createFileStores({ uploadsDir, privateDir }: { uploadsDir: string; privateDir: string }): FileStores {
  const publicToken = process.env.BLOB_READ_WRITE_TOKEN
  const privateToken = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN
  if (Boolean(publicToken) !== Boolean(privateToken)) throw new Error('Set both BLOB_READ_WRITE_TOKEN and PRIVATE_BLOB_READ_WRITE_TOKEN, or neither')
  if (publicToken && privateToken) {
    return { publicFiles: createBlobStore({ access: 'public', token: publicToken }), privateFiles: createBlobStore({ access: 'private', token: privateToken }) }
  }
  return { publicFiles: createDiskStore(uploadsDir), privateFiles: createDiskStore(privateDir) }
}
