import { useEffect, useRef, useState } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { SessionOptions, AdminSessionDetail, CreateSessionResponse } from '@shared/api/admin-sessions'
import type { FieldErrorCode } from '@shared/api/errors'
import { validateSessionFields } from '@shared/session-rules'
import { clubToday, clubDateTimeToInstant, clubDateOf, clubTimeOf, isClubDate } from '@shared/club-time'
import { useI18n } from '@/i18n/use-i18n'
import { apiErrorMessages, fieldErrorMessage } from '@/i18n/api-error-messages'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateLong } from '@/i18n/format'
import { Button } from '@/components/ui/button'
import { DateField } from '@/components/ui/date-field'
import { TimeField } from '@/components/ui/time-field'
import { SelectField } from '@/components/ui/select-field'
import { StatusPanel } from '@/components/ui/status-panel'
import { parseInteger } from '../forms/form-values'
import { DiscardChangesDialog } from '@/components/admin/DiscardChangesDialog'
import { useAdminAuth } from '../auth/use-admin-auth'
import { useAdminResource } from '../forms/use-admin-resource'
import { useUnsavedChangesGuard } from '../forms/use-unsaved-changes-guard'
import { SessionFields } from '../forms/SessionFields'
import { AdminBand } from '../shell/AdminBand'
import { cn } from '@/lib/utils'
import { setNavMotion } from '@/lib/nav-motion'
import { FormFeedback } from '../forms/FormFeedback'
import { adminMessages as messages } from '../forms/admin.messages'
import { newSessionDraft, draftFromSession, applyClassDefaults, hasOverrides, loadDraft, saveDraft, clearDraft } from './session-draft'
import type { SessionDraft } from './session-draft'
import { SessionReview } from './SessionReview'
import { stepEnter, useStepDirection } from '@/lib/step-motion'
import { revealInvalid } from '@/lib/reveal-invalid'
const stepNames = [{ id: 'Kelas dan waktu', en: 'Class and time' }, { id: 'Level, lokasi, dan coach', en: 'Level, venue, and coaches' }, { id: 'Harga dan batas peserta', en: 'Price and participant limits' }, { id: 'Periksa sesi', en: 'Review session' }]
const stepFields = [['classId', 'date', 'startTime', 'durationMinutes'], ['levelId', 'venueId', 'coachIds'], ['priceIdr', 'minParticipants', 'maxParticipants']]
export function SessionEditorPage() {
  const { id } = useParams()
  const { t } = useI18n()
  const resource = useAdminResource<AdminSessionDetail>(id ? `/api/admin/sessions/${id}` : null)
  if (id && !resource.data) return <div className="page-gutter mx-auto max-w-[50rem] py-6"><StatusPanel tone={resource.response ? 'error' : 'info'} title={t(resource.response ? messages.loadError : messages.loading)} action={resource.response ? { label: t(commonMessages.retry), onAction: resource.retry } : undefined} /></div>
  return <SessionEditor key={id ?? 'new'} initial={resource.data} />
}
function SessionEditor({ initial }: { initial: AdminSessionDetail | null }) {
  const { t, language } = useI18n()
  const { identity, send } = useAdminAuth()
  const owner = identity ?? ''
  const options = useAdminResource<SessionOptions>('/api/admin/session-options')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [baseline, setBaseline] = useState(initial)
  const [draft, setDraft] = useState<SessionDraft>(() => {
    if (initial) return draftFromSession(owner, initial)
    try { const retained = loadDraft(sessionStorage, owner); if (retained) return retained } catch { /* Browser storage is optional. */ }
    return newSessionDraft(owner, isClubDate(params.get('date')) ? params.get('date')! : clubToday(), crypto.randomUUID())
  })
  const [errors, setErrors] = useState<Record<string, FieldErrorCode>>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [latest, setLatest] = useState<AdminSessionDetail | null>(null)
  const [newClassId, setNewClassId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const reduceMotion = useReducedMotion()
  const sending = useRef(false)
  const editor = useRef<HTMLDivElement>(null)
  const stepHeading = useRef<HTMLHeadingElement>(null)
  const initialDate = isClubDate(params.get('date')) ? params.get('date')! : clubToday()
  const dirty = initial ? JSON.stringify({ ...draft, step: 1 }) !== JSON.stringify(draftFromSession(owner, baseline!)) : Boolean(draft.classId || draft.startTime || draft.coachIds.length || draft.date !== initialDate || draft.durationMinutes || draft.levelId || draft.venueId || draft.priceIdr || draft.minParticipants || draft.maxParticipants)
  const guard = useUnsavedChangesGuard(dirty, () => { if (draft.mode === 'create') { try { clearDraft(sessionStorage) } catch { /* Storage is optional. */ } } }, pending)
  useEffect(() => { if (draft.mode === 'create') { try { saveDraft(sessionStorage, draft) } catch { /* Storage is optional. */ } } }, [draft])
  useEffect(() => { stepHeading.current?.focus({ preventScroll: true }); stepHeading.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }) }, [draft.step])
  const goToStep = (step: number) => setDraft(current => ({ ...current, step }))
  const direction = useStepDirection(draft.step)
  const setField = (field: string, value: string | string[]) => setDraft(current => ({ ...current, [field]: value }))
  const errorFor = (field: string, label: string) => errors[field] ? t(fieldErrorMessage(field, errors[field]), { field: label }) : undefined
  const payload = () => ({ classId: draft.classId, date: draft.date, startTime: draft.startTime, levelId: draft.levelId, venueId: draft.venueId, coachIds: draft.coachIds,
    ...Object.fromEntries(['durationMinutes', 'priceIdr', 'minParticipants', 'maxParticipants'].map(field => [field, parseInteger(draft[field as keyof SessionDraft] as string)])) })
  const focusError = () => revealInvalid(editor.current)
  const validate = (onlyStep?: number) => {
    const fields = validateSessionFields(payload(), { today: clubToday(), now: new Date() }) as Record<string, FieldErrorCode>
    if (baseline && draft.date === baseline.date && draft.startTime === baseline.startTime) { delete fields.date; delete fields.startTime }
    if (options.data && draft.coachIds.some(id => !options.data!.coaches.some(coach => coach.id === id))) fields.coachIds = 'REFERENCE_NOT_FOUND'
    const selected = onlyStep ? Object.fromEntries(Object.entries(fields).filter(([key]) => stepFields[onlyStep - 1]?.includes(key))) : fields
    setErrors(selected)
    if (Object.keys(selected).length) { if (!onlyStep) goToStep(stepFields.findIndex(keys => keys.some(key => selected[key])) + 1 || 1); focusError(); return false }
    return true
  }
  const selectClass = (id: string) => {
    const selected = options.data?.classes.find(row => row.id === id)
    if (selected) { setDraft(current => applyClassDefaults(current, id, selected.defaults)); setErrors({}) }
    setNewClassId(null)
  }
  const save = async () => {
    if (sending.current || !options.data || !validate()) return
    sending.current = true; setPending(true); setFailure(null)
    try {
      const result = await send<AdminSessionDetail | CreateSessionResponse>(initial ? 'PUT' : 'POST', `/api/admin/sessions${initial ? `/${initial.id}` : ''}`, { ...payload(), ...(initial ? { version: baseline!.version } : { createRequestId: draft.createRequestId }) })
      if (result.kind === 'ok') {
        const session = 'session' in result.data ? result.data.session : result.data
        try { clearDraft(sessionStorage) } catch { /* Storage is optional. */ }
        guard.allowNavigation()
        setNavMotion('pop'); navigate(`/admin/sessions?date=${session.date}`, { state: { savedId: session.id }, viewTransition: true }); return
      }
      if (result.kind === 'http') {
        setErrors(result.fields ?? {}); setFailure(t(apiErrorMessages[result.code]))
        if (result.code === 'STALE_VERSION') setLatest(result.latest as AdminSessionDetail)
        if (result.fields) { const index = stepFields.findIndex(fields => fields.some(field => result.fields?.[field])); if (index >= 0) goToStep(index + 1); focusError() }
      } else setFailure(t(messages.saveError))
    } finally { sending.current = false; setPending(false) }
  }
  const complete = options.data && options.data.classes.length && options.data.levels.length && options.data.venues.length && options.data.coaches.length
  const availableOptions = options.data ?? { classes: [], levels: [], venues: [], coaches: [] }
  const conflictOptions = latest ? {
    ...availableOptions,
    classes: [...availableOptions.classes.filter(row => row.id !== latest.classId), { id: latest.classId, name: latest.className, defaults: { levelId: latest.levelId, venueId: latest.venueId, coachIds: latest.coaches.map(row => row.id), durationMinutes: latest.durationMinutes, priceIdr: latest.priceIdr, minParticipants: latest.minParticipants, maxParticipants: latest.maxParticipants } }],
    levels: [...availableOptions.levels.filter(row => row.id !== latest.levelId), { id: latest.levelId, name: latest.levelName }],
    venues: [...availableOptions.venues.filter(row => row.id !== latest.venueId), availableOptions.venues.find(row => row.id === latest.venueId) ?? { id: latest.venueId, name: latest.venueName, address: null, hasPin: false }],
    // The newer version's coaches keep their portrait when they are still among the options.
    coaches: [...availableOptions.coaches.filter(row => !latest.coaches.some(coach => coach.id === row.id)),
      ...latest.coaches.map(coach => availableOptions.coaches.find(row => row.id === coach.id) ?? { ...coach, photoUrl: null, classCount: 0 })],
  } : availableOptions
  const validTime = isClubDate(draft.date) && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime)
  const end = validTime && /^\d+$/.test(draft.durationMinutes) && Number(draft.durationMinutes) <= 720 ? new Date(clubDateTimeToInstant(draft.date, draft.startTime).getTime() + Number(draft.durationMinutes) * 60000) : null
  const steps = 4
  return <>
  <AdminBand title={t(initial ? { id: 'Ubah sesi', en: 'Edit session' } : { id: 'Tambah sesi', en: 'Add session' })} back={{ to: `/admin/sessions${draft.date ? `?date=${draft.date}` : ''}`, label: t({ id: 'Sesi', en: 'Sessions' }) }}>
    <div className="flex gap-1.5" aria-hidden="true">{Array.from({ length: steps }, (_, index) => <span key={index} className={cn('h-1.5 flex-1 rounded-full', index < draft.step ? 'bg-accent' : 'bg-band-tile')} />)}</div>
  </AdminBand>
  <div ref={editor} className="page-gutter mx-auto flex max-w-[50rem] flex-col gap-6 overflow-x-clip py-5" aria-busy={pending}>
    <div><p className="text-label text-on-surface-variant">{t({ id: 'Langkah {n} dari 4', en: 'Step {n} of 4' }, { n: draft.step })}</p><h2 ref={stepHeading} tabIndex={-1} className="scroll-mt-24 text-title font-bold focus:outline-none">{t(stepNames[draft.step - 1])}</h2></div>
    {!options.data && <StatusPanel tone={options.response ? 'error' : 'info'} title={t(options.response ? messages.loadError : messages.loading)} action={options.response ? { label: t(commonMessages.retry), onAction: options.retry } : undefined} />}
    {options.data && !complete && <StatusPanel tone="info" title={t(messages.missing)}><Button asChild><Link to="/admin/manage" onClick={() => { if (draft.mode === 'create') { try { saveDraft(sessionStorage, draft) } catch { /* Storage is optional. */ } guard.allowNavigation() } }}>{t(messages.manage)}</Link></Button><Button asChild><Link to="/admin/classes/new" onClick={() => { if (draft.mode === 'create') { try { saveDraft(sessionStorage, draft) } catch { /* Storage is optional. */ } guard.allowNavigation() } }}>{t({ id: 'Tambah kelas', en: 'Add class' })}</Link></Button></StatusPanel>}
    <m.div key={draft.step} {...stepEnter(direction, reduceMotion)} className="flex min-w-0 flex-col gap-6">
      {draft.step === 1 && <>
        <SelectField name="classId" label={t(messages.classes)} value={draft.classId} options={availableOptions.classes} placeholder={t(messages.choose)} hint={t({ id: 'Memilih kelas mengisi nilai awal yang dapat diubah untuk sesi ini.', en: 'Choosing a class fills defaults you can edit for this session.' })} error={errorFor('classId', t(messages.classes))} onChange={id => {
          if (id === draft.classId) return
          const current = options.data?.classes.find(row => row.id === draft.classId)
          if (draft.classId && (initial || hasOverrides(draft, current?.defaults))) setNewClassId(id); else selectClass(id)
        }} />
        <div className="grid min-w-0 gap-6 sm:grid-cols-2">
          <DateField name="date" label={t({ id: 'Tanggal (WIB)', en: 'Date (WIB)' })} value={draft.date} today={clubToday()} earliest={baseline && baseline.date < clubToday() ? baseline.date : clubToday()} onChange={value => setField('date', value)} error={errorFor('date', t({ id: 'Tanggal', en: 'Date' }))} />
          <TimeField name="startTime" label={t({ id: 'Waktu mulai (WIB)', en: 'Start time (WIB)' })} value={draft.startTime} onChange={value => setField('startTime', value)} error={errorFor('startTime', t({ id: 'Waktu mulai', en: 'Start time' }))} />
        </div>
        <SessionFields section="duration" values={draft} setField={setField} errors={errors} options={availableOptions} />
        {end && <p className="text-on-surface-variant">{t({ id: 'Selesai', en: 'Ends' })}: {formatClubDateLong(clubDateOf(end), language)} {clubTimeOf(end)} WIB</p>}
      </>}
      {draft.step === 2 && <SessionFields section="venue" optionsStatus={options.data ? 'ready' : options.response ? 'error' : 'loading'} values={draft} setField={setField} errors={errors} options={availableOptions} />}
      {draft.step === 3 && <SessionFields section="limits" values={draft} setField={setField} errors={errors} options={availableOptions} />}
      {draft.step === 4 && <><SessionReview draft={draft} options={availableOptions} /><div className="flex flex-wrap gap-2">{stepNames.slice(0, 3).map((name, index) => <Button key={name.en} variant="text" disabled={pending} onClick={() => goToStep(index + 1)}>{t(messages.edit)}: {t(name)}</Button>)}</div><StatusPanel tone="info" title={t(initial ? { id: 'Perubahan akan langsung terlihat pada jadwal publik.', en: 'Changes will appear immediately on the public schedule.' } : { id: 'Sesi akan langsung tampil di jadwal setelah disimpan.', en: 'The session appears on the schedule as soon as you save.' })} /></>}
    </m.div>
    <FormFeedback failure={failure} latest={latest && <SessionReview draft={draftFromSession(owner, latest)} options={conflictOptions} />} yours={<SessionReview draft={draft} options={availableOptions} />} onReplace={() => { if (latest) { setBaseline(latest); setDraft(draftFromSession(owner, latest)); setLatest(null); setFailure(null); setErrors({}) } }} />
  </div>
  <div data-bottom-chrome className="sticky bottom-0 z-10 border-t border-outline-variant bg-surface-container-lowest pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
    <div data-session-actions className="page-gutter mx-auto grid max-w-[50rem] grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-stretch gap-2 sm:flex sm:justify-end">
      {draft.step > 1 && <Button className="min-w-0 px-3" variant="text" disabled={pending} onClick={() => goToStep(draft.step - 1)}>{t(messages.cancel)}</Button>}
      {draft.step < 4 ? <Button className="col-start-2 min-w-0 px-3 sm:min-w-40" variant="filled" disabled={!complete || pending} onClick={() => { if (validate(draft.step)) goToStep(draft.step + 1) }}>{t({ id: 'Lanjut', en: 'Continue' })}</Button> : <Button className="min-w-0 px-3 sm:min-w-56" variant="filled" disabled={!complete || pending || Boolean(latest)} pendingLabel={pending ? t({ id: 'Menyimpan sesi...', en: 'Saving session...' }) : undefined} onClick={() => void save()}>{t(initial ? { id: 'Simpan perubahan sesi', en: 'Save session changes' } : { id: 'Simpan dan tampilkan sesi', en: 'Save and publish session' })}</Button>}
    </div>
  </div>
  {guard.dialog}<DiscardChangesDialog open={newClassId !== null} classChange onKeep={() => setNewClassId(null)} onDiscard={() => { if (newClassId) selectClass(newClassId) }} />
  </>
}
export const Component = SessionEditorPage
