import { describe, expect, it } from 'vitest'
import { failureNeedsPanel } from '../../src/features/admin/forms/form-failure'

// G1: one feedback per outcome. A failed save gets a panel only when nothing else already says what went wrong.
describe('failureNeedsPanel', () => {
  it('leaves field problems to the fields', () => {
    expect(failureNeedsPanel('VALIDATION_FAILED', { name: 'REQUIRED' })).toBe(false)
    expect(failureNeedsPanel('DUPLICATE_NAME', { name: 'DUPLICATE_NAME' })).toBe(false)
  })
  it('keeps a panel for a validation failure no field explains', () => {
    expect(failureNeedsPanel('VALIDATION_FAILED', {})).toBe(true)
    expect(failureNeedsPanel('VALIDATION_FAILED')).toBe(true)
  })
  it('leaves an ended admin session to the sign-in screen', () => {
    expect(failureNeedsPanel('UNAUTHENTICATED')).toBe(false)
  })
  it('shows other failures', () => {
    expect(failureNeedsPanel('STALE_VERSION')).toBe(true)
    expect(failureNeedsPanel('INTERNAL')).toBe(true)
  })
})
