import type { AdminSessionDetail, SessionDefaults } from '@shared/api/admin-sessions'
import type { DefaultValues } from '../forms/form-values'
import { emptyDefaults } from '../forms/form-values'
export interface SessionDraft extends DefaultValues {
  owner: string; mode: 'create' | 'edit'; sessionId?: string; version?: number; createRequestId: string; step: number
  classId: string; date: string; startTime: string
}
export const DRAFT_KEY = 'lafu.sessionDraft'
export function newSessionDraft(owner: string, date: string, requestId: string): SessionDraft { return { ...emptyDefaults, coachIds: [], owner, date, mode: 'create', createRequestId: requestId, step: 1, classId: '', startTime: '' } }
export function applyClassDefaults(draft: SessionDraft, classId: string, defaults: SessionDefaults): SessionDraft {
  return { ...draft, classId, levelId: defaults.levelId, venueId: defaults.venueId, coachIds: [...defaults.coachIds], durationMinutes: String(defaults.durationMinutes), priceIdr: String(defaults.priceIdr), minParticipants: String(defaults.minParticipants), maxParticipants: String(defaults.maxParticipants) }
}
export function hasOverrides(draft: SessionDraft, defaults?: SessionDefaults) {
  if (!defaults) return false
  const expected = applyClassDefaults(draft, draft.classId, defaults)
  return ['levelId', 'venueId', 'coachIds', 'durationMinutes', 'priceIdr', 'minParticipants', 'maxParticipants'].some(key => JSON.stringify(draft[key as keyof SessionDraft]) !== JSON.stringify(expected[key as keyof SessionDraft]))
}
export function draftFromSession(owner: string, session: AdminSessionDetail): SessionDraft {
  return { owner, mode: 'edit', sessionId: session.id, version: session.version, createRequestId: '', step: 1, classId: session.classId, date: session.date, startTime: session.startTime,
    levelId: session.levelId, venueId: session.venueId, coachIds: session.coaches.map(coach => coach.id), durationMinutes: String(session.durationMinutes), priceIdr: String(session.priceIdr), minParticipants: String(session.minParticipants), maxParticipants: String(session.maxParticipants) }
}
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>
const textKeys = ['owner', 'mode', 'createRequestId', 'classId', 'date', 'startTime', 'levelId', 'venueId', 'durationMinutes', 'priceIdr', 'minParticipants', 'maxParticipants'] as const
export function saveDraft(storage: Storage, draft: SessionDraft) {
  if (draft.mode !== 'create') return
  const safe = Object.fromEntries(textKeys.map(key => [key, draft[key]]))
  try { storage.setItem(DRAFT_KEY, JSON.stringify({ ...safe, step: draft.step, coachIds: draft.coachIds })) } catch { /* The editor remains usable without browser storage. */ }
}
export function clearDraft(storage: Storage) { try { storage.removeItem(DRAFT_KEY) } catch { /* Storage is optional. */ } }
export function loadDraft(storage: Storage, owner: string): SessionDraft | null {
  try {
    const raw: unknown = JSON.parse(storage.getItem(DRAFT_KEY) ?? 'null')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
    const draft = raw as Record<string, unknown>
    if (draft.owner !== owner) { clearDraft(storage); return null }
    if (draft.mode !== 'create' || !textKeys.every(key => typeof draft[key] === 'string') || !Number.isInteger(draft.step) || Number(draft.step) < 1 || Number(draft.step) > 4 || !Array.isArray(draft.coachIds) || !draft.coachIds.every(id => typeof id === 'string') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(draft.createRequestId))) return null
    return { ...Object.fromEntries(textKeys.map(key => [key, draft[key]])), step: draft.step, coachIds: draft.coachIds } as SessionDraft
  } catch { return null }
}
