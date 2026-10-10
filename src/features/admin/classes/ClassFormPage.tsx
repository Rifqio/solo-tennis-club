import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ClassRecord } from '@shared/api/admin-classes'
import type { SessionOptions } from '@shared/api/admin-sessions'
import type { FieldErrorCode } from '@shared/api/errors'
import { validateClassFields } from '@shared/class-rules'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { StatusPanel } from '@/components/ui/status-panel'
import { parseInteger, emptyDefaults } from '../forms/form-values'
import { apiErrorMessages, fieldErrorMessage } from '@/i18n/api-error-messages'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { useMediaQuery } from '@/lib/use-media-query'
import { useAdminAuth } from '../auth/use-admin-auth'
import { useAdminResource } from '../forms/use-admin-resource'
import { useUnsavedChangesGuard } from '../forms/use-unsaved-changes-guard'
import { SessionFields } from '../forms/SessionFields'
import type { DefaultValues } from '../forms/form-values'
import { FormFeedback } from '../forms/FormFeedback'
import { adminMessages as messages } from '../forms/admin.messages'
import { AdminBand } from '../shell/AdminBand'
import { ClassDesktop } from './ClassDesktop'
const mapping = { levelId: 'defaultLevelId', venueId: 'defaultVenueId', durationMinutes: 'defaultDurationMinutes', priceIdr: 'defaultPriceIdr', minParticipants: 'defaultMinParticipants', maxParticipants: 'defaultMaxParticipants', coachIds: 'defaultCoachIds' } as const
const fromRecord = (record: ClassRecord | null): DefaultValues => record ? { levelId: record.defaultLevelId, venueId: record.defaultVenueId, durationMinutes: String(record.defaultDurationMinutes), priceIdr: String(record.defaultPriceIdr), minParticipants: String(record.defaultMinParticipants), maxParticipants: String(record.defaultMaxParticipants), coachIds: record.defaultCoachIds } : emptyDefaults
export function ClassFormPage() {
  const { id } = useParams()
  const { t } = useI18n()
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const resource = useAdminResource<ClassRecord>(id && !isDesktop ? `/api/admin/classes/${id}` : null)
  // Desktop shows the class list and this form side by side.
  if (isDesktop) return <ClassDesktop selected={id ?? 'new'} />
  if (id && !resource.data) return <><AdminBand title={t({ id: 'Ubah kelas', en: 'Edit class' })} back={{ to: '/admin/classes', label: t(messages.classes) }} /><div className="page-gutter mx-auto max-w-[50rem] py-6"><StatusPanel tone={resource.response ? 'error' : 'info'} title={t(resource.response ? messages.loadError : messages.loading)} action={resource.response ? { label: t(commonMessages.retry), onAction: resource.retry } : undefined} /></div></>
  return <ClassForm key={id ?? 'new'} initial={resource.data} />
}
// `embedded`: inside the desktop Kelas card (board D10), without its own band, with the fields in the board's order
// (name, coaches, venue list, level and duration side by side, price, players) and the save button at the card's foot.
// Phones follow board 17: name, level, venue, duration, price, players, then coaches.
export function ClassForm({ initial, embedded = false }: { initial: ClassRecord | null; embedded?: boolean }) {
  const { t } = useI18n()
  const { send } = useAdminAuth()
  const options = useAdminResource<SessionOptions>('/api/admin/session-options')
  const navigate = useNavigate()
  const [baseline, setBaseline] = useState(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [values, setValues] = useState(() => fromRecord(initial))
  const [requestId] = useState(() => crypto.randomUUID())
  const [errors, setErrors] = useState<Record<string, FieldErrorCode>>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [latest, setLatest] = useState<ClassRecord | null>(null)
  const [pending, setPending] = useState(false)
  const sending = useRef(false)
  const form = useRef<HTMLFormElement>(null)
  const guard = useUnsavedChangesGuard(name !== (baseline?.name ?? '') || JSON.stringify(values) !== JSON.stringify(fromRecord(baseline)), undefined, pending)
  const setField = (field: keyof DefaultValues, value: string | string[]) => setValues(current => ({ ...current, [field]: value }))
  const payload = () => Object.fromEntries(Object.entries(mapping).map(([field, target]) => [target, ['durationMinutes', 'priceIdr', 'minParticipants', 'maxParticipants'].includes(field) ? parseInteger(values[field as keyof DefaultValues] as string) : values[field as keyof DefaultValues]]))
  const focusErrors = () => requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid=true]')?.focus())
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (sending.current || !options.data) return
    const input = { name, ...payload() }
    const fields = validateClassFields(input)
    const translateFields = (fields: Record<string, FieldErrorCode>) => Object.fromEntries(Object.entries(fields).map(([field, code]) => [Object.entries(mapping).find(([, target]) => target === field)?.[0] ?? field, code]))
    setErrors(translateFields(fields))
    if (Object.keys(fields).length) { focusErrors(); return }
    sending.current = true; setPending(true); setFailure(null)
    try {
      const result = await send<ClassRecord>(initial ? 'PUT' : 'POST', `/api/admin/classes${initial ? `/${initial.id}` : ''}`, { ...input, ...(initial ? { version: baseline!.version } : { createRequestId: requestId }) })
      if (result.kind === 'ok') { guard.allowNavigation(); navigate('/admin/classes', { state: { savedId: result.data.id } }); return }
      if (result.kind === 'http') { setErrors(translateFields(result.fields ?? {})); setFailure(t(apiErrorMessages[result.code])); if (result.code === 'STALE_VERSION') setLatest(result.latest as ClassRecord); focusErrors() }
      else setFailure(t(messages.saveError))
    } finally { sending.current = false; setPending(false) }
  }
  const optionsStatus = options.data ? 'ready' as const : options.response ? 'error' as const : 'loading' as const
  const field = (section: 'level' | 'place' | 'coaches' | 'duration' | 'limits') => <SessionFields section={section} optionsStatus={optionsStatus} venueList={embedded}
    options={options.data ?? { classes: [], levels: [], venues: [], coaches: [] }} values={values} setField={setField} errors={errors} />
  const preview = (record: ClassRecord) => <p>{record.name}<br />{record.levelName} · {record.venueName}<br />{record.defaultDurationMinutes} / Rp {record.defaultPriceIdr}<br />{record.defaultMinParticipants} – {record.defaultMaxParticipants}<br />{record.coaches.map(coach => coach.name).join(', ')}</p>
  return <>
  {!embedded && <AdminBand title={t(initial ? { id: 'Ubah kelas', en: 'Edit class' } : { id: 'Tambah kelas', en: 'Add class' })} back={{ to: '/admin/classes', label: t(messages.classes) }} />}
  <div className={embedded ? 'flex flex-col gap-5 px-6 pt-6' : 'page-gutter mx-auto flex max-w-[50rem] flex-col gap-6 pt-5'}>
    {embedded && <div className="flex flex-col gap-0.5">
      <p className="text-label font-semibold text-on-surface-variant">{t(initial ? { id: 'Ubah kelas', en: 'Edit class' } : { id: 'Baru', en: 'New' })}</p>
      <h2 className="break-words text-headline font-bold">{initial ? baseline?.name ?? initial.name : t({ id: 'Tambah kelas', en: 'Add class' })}</h2>
    </div>}
    {!options.data && <StatusPanel tone={options.response ? 'error' : 'info'} title={t(options.response ? messages.loadError : messages.loading)} action={options.response ? { label: t(commonMessages.retry), onAction: options.retry } : undefined} />}
    {options.data && (!options.data.levels.length || !options.data.venues.length || !options.data.coaches.length) && <StatusPanel tone="info" title={t(messages.missing)}><Button asChild><Link to="/admin/manage">{t(messages.manage)}</Link></Button></StatusPanel>}
    <form ref={form} noValidate onSubmit={submit} aria-busy={pending} className="flex flex-col gap-6">
      <TextField name="name" label={t(messages.name)} value={name} onChange={event => setName(event.target.value)} required error={errors.name ? t(fieldErrorMessage('name', errors.name), { field: t(messages.name) }) : undefined} />
      {embedded ? <>
        {field('coaches')}
        {field('place')}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">{field('level')}{field('duration')}</div>
        {field('limits')}
      </> : <>
        {field('level')}{field('place')}{field('duration')}{field('limits')}{field('coaches')}
      </>}
      <FormFeedback failure={failure} latest={latest && preview(latest)} yours={<p>{name}<br />{options.data?.levels.find(row => row.id === values.levelId)?.name} · {options.data?.venues.find(row => row.id === values.venueId)?.name}<br />{values.durationMinutes} / Rp {values.priceIdr}<br />{values.minParticipants} – {values.maxParticipants}<br />{values.coachIds.map(id => options.data?.coaches.find(row => row.id === id)?.name ?? id).join(', ')}</p>} onReplace={() => { if (latest) { setBaseline(latest); setName(latest.name); setValues(fromRecord(latest)); setLatest(null); setFailure(null); setErrors({}) } }} />
      <div className={embedded ? '-mx-6 flex justify-end border-t border-outline-variant px-6 py-4' : 'sticky bottom-0 z-10 border-t border-outline-variant bg-surface-container-lowest pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 [margin-inline:calc(50%-50vw)] [padding-inline:max(1rem,calc(50vw-50%))]'}>
        <Button className={embedded ? 'px-10' : 'w-full'} type="submit" variant="filled" disabled={pending || !options.data || Boolean(latest)} pendingLabel={pending ? t(messages.saving) : undefined}>{t({ id: 'Simpan kelas', en: 'Save class' })}</Button>
      </div>
    </form>{guard.dialog}
  </div>
  </>
}
export const Component = ClassFormPage
