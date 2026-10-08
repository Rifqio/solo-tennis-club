import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// Guards the Phase 1 design contract (UI-SPEC, D-23, D-24) for every later UI plan.
const SRC = join(process.cwd(), 'src')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(tsx?|css)$/.test(entry.name) ? [path] : []
  })
}

const files = sourceFiles(SRC).map(path => ({ name: relative(SRC, path).replaceAll('\\', '/'), text: readFileSync(path, 'utf8') }))
const code = files.filter(file => file.name.endsWith('.ts') || file.name.endsWith('.tsx'))
const css = readFileSync(join(SRC, 'index.css'), 'utf8')

function offenders(pattern: RegExp, scope = code) {
  return scope.flatMap(file => [...file.text.matchAll(pattern)].map(match => `${file.name}: ${match[0]}`))
}

describe('design token guard', () => {
  it('uses only the five text roles (label, body, title, headline, numeral)', () => {
    expect(offenders(/\btext-(?:xs|sm|base|lg|[2-9]?xl|display|heading)\b|\btext-\[\d/g)).toEqual([])
  })

  it('uses only weights 400 and 700', () => {
    expect(offenders(/\bfont-(?:thin|extralight|light|medium|semibold|extrabold|black|\[\d)/g)).toEqual([])
  })

  it('has no gradient, glow, blur, or ad-hoc shadow effects', () => {
    expect(offenders(/\bbg-(?:linear|radial|conic|gradient)\b|\bbg-gradient-|\bbackdrop-blur|\bblur(?:-\w+)?\b|\bdrop-shadow|\bshadow-(?!sheet\b|menu\b)[\w[]/g)).toEqual([])
  })

  it('keeps hex colors in index.css only', () => {
    expect(offenders(/#[0-9a-fA-F]{3,8}\b/g)).toEqual([])
  })

  it('never renders raw HTML', () => {
    expect(offenders(/dangerouslySetInnerHTML/g)).toEqual([])
  })

  it('defines the locked palette and contrast-tested semantic colors', () => {
    for (const hex of ['#164D45', '#FFFFFF', '#1D252C', '#EDF4F1', '#4B5D57', '#B42318', '#FEECE8', '#805000', '#FFF4D6', '#F5F9F7', '#C9E7DE', '#0E1916']) {
      expect(css.toUpperCase()).toContain(hex)
    }
  })

  it('follows the phone appearance with a solid 2px primary focus outline', () => {
    expect(css).not.toMatch(/\.dark\b|@custom-variant dark/)
    expect(css).toContain('@media (prefers-color-scheme: dark)')
    expect(css).toMatch(/:focus-visible\s*{\s*outline:\s*2px solid var\(--md-primary\);\s*outline-offset:\s*2px;/)
    expect(css).toContain('prefers-reduced-motion: reduce')
  })
})
