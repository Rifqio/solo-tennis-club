import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { expect, test } from 'vitest'
import { projectRoot } from '../../server/config/database-file.ts'

function filesWithin(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? filesWithin(path) : [path]
  })
}
test('production assets contain no Prisma runtime, SQLite adapter, Express or database configuration', () => {
  const assets = resolve(projectRoot, 'dist/assets')
  expect(existsSync(assets)).toBe(true)
  const scripts = filesWithin(assets).filter(path => path.endsWith('.js'))
  expect(scripts.length).toBeGreaterThan(0)
  for (const path of scripts) {
    const source = readFileSync(path, 'utf8')
    for (const marker of ['@prisma/client', 'PrismaClient', 'PrismaBetterSqlite3', 'better-sqlite3', 'data/stc.db', 'express/lib', 'express.application', 'ZodError']) {
      expect(source, path + ' contains ' + marker).not.toContain(marker)
    }
  }
})
test('browser and shared imports never resolve to server code or server-only packages', () => {
  const files = ['src', 'shared'].flatMap(directory => filesWithin(resolve(projectRoot, directory))).filter(path => /\.tsx?$/.test(path))
  const serverRoot = resolve(projectRoot, 'server')
  for (const path of files) {
    const source = readFileSync(path, 'utf8')
    const imports = source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?|\brequire\s*\()\s*['"]([^'"]+)['"]/g)
    for (const match of imports) {
      const specifier = match[1]
      expect(specifier, path).not.toMatch(/^(?:@prisma(?:\/|$)|better-sqlite3(?:\/|$)|express(?:\/|$)|zod(?:\/|$)|@server(?:\/|$))/)
      const resolved = specifier.startsWith('.') ? resolve(dirname(path), specifier) : specifier.startsWith('@/') ? resolve(projectRoot, 'src', specifier.slice(2)) : specifier.startsWith('@shared/') ? resolve(projectRoot, 'shared', specifier.slice(8)) : undefined
      if (resolved) {
        const relation = relative(serverRoot, resolved)
        expect(relation === '' || (!isAbsolute(relation) && relation !== '..' && !relation.startsWith('..' + sep)), path + ': ' + specifier).toBe(false)
      }
    }
  }
})
