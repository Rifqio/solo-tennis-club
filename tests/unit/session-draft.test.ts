import { expect, test } from 'vitest'
import { newSessionDraft, applyClassDefaults, hasOverrides, saveDraft, loadDraft, DRAFT_KEY } from '../../src/features/admin/sessions/session-draft'
test('create drafts preserve input, defaults, step and request id only for their owning admin; no credentials persist', () => {
  const entries = new Map<string, string>()
  const storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key,value) }, removeItem: (key: string) => { entries.delete(key) } }
  const defaults = { levelId: 'level', venueId: 'venue', coachIds: ['coach'], durationMinutes: 90, priceIdr: 150000, minParticipants: 2, maxParticipants: 8 }
  const draft = applyClassDefaults(newSessionDraft('admin@lafu.test', '2030-01-01', '11111111-1111-4111-8111-111111111111'), 'class', defaults)
  expect(hasOverrides(draft, defaults)).toBe(false)
  expect(hasOverrides({ ...draft, priceIdr: '175000' }, defaults)).toBe(true)
  saveDraft(storage, { ...draft, step: 3, password: 'secret', csrfToken: 'secret', cookie: 'secret' } as typeof draft)
  expect(entries.get(DRAFT_KEY)).not.toContain('secret')
  expect(loadDraft(storage, 'admin@lafu.test')).toEqual({ ...draft, step: 3 })
  expect(loadDraft(storage, 'other@lafu.test')).toBeNull(); expect(entries.has(DRAFT_KEY)).toBe(false)
  storage.setItem(DRAFT_KEY, '{broken'); expect(loadDraft(storage, 'admin@lafu.test')).toBeNull()
  saveDraft(storage, { ...draft, mode: 'edit' }); expect(entries.get(DRAFT_KEY)).toBe('{broken')
})
