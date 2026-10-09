import { expect, test } from 'vitest'
import { cn } from '../../src/lib/utils'

test('custom text sizes merge as sizes, not colors', () => {
  expect(cn('text-label text-on-surface', 'text-title')).toBe('text-on-surface text-title')
  expect(cn('text-on-surface-variant text-label', 'text-on-signboard')).toBe('text-label text-on-signboard')
})

test('custom shadows replace each other', () => {
  expect(cn('shadow-fab', 'shadow-none')).toBe('shadow-none')
})
