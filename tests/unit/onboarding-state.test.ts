import { afterEach, expect, test, vi } from 'vitest'
import { markOnboarded, ONBOARDED_KEY, shouldShowOnboarding } from '../../src/features/public/onboarding/onboarding-state'

function stubStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  vi.stubGlobal('window', { localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value) } } })
  return store
}
afterEach(() => { vi.unstubAllGlobals() })

test('shows only on a first visit that starts on the plain schedule', () => {
  stubStorage()
  expect(shouldShowOnboarding('/', '', false)).toBe(true)
  for (const [path, search] of [['/', '?date=2026-10-12'], ['/', '?session=abc'], ['/club', ''], ['/book/abc', ''], ['/customer/sign-in', '']]) {
    expect(shouldShowOnboarding(path, search, false)).toBe(false)
    expect(shouldShowOnboarding(path, search, true)).toBe(false)
  }
})

test('finishing or skipping stores the flag so it never returns', () => {
  const store = stubStorage()
  markOnboarded()
  expect(store.get(ONBOARDED_KEY)).toBe('1')
  expect(shouldShowOnboarding('/', '', false)).toBe(false)
})

test('blocked storage never shows it rather than failing', () => {
  vi.stubGlobal('window', { localStorage: { getItem: () => { throw new Error('blocked') } } })
  expect(shouldShowOnboarding('/', '', false)).toBe(false)
})

test('testing mode shows it on every plain schedule load, even after finishing', () => {
  stubStorage({ [ONBOARDED_KEY]: '1' })
  expect(shouldShowOnboarding('/', '', true)).toBe(true)
})
