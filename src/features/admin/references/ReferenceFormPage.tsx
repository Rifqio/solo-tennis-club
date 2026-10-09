import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ReferenceKind, ReferenceRecord } from '@shared/api/admin-references'
import type { FieldErrorCode } from '@shared/api/errors'
import { validateReferenceFields } from '@shared/reference-rules'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { apiErrorMessages, fieldErrorMessage } from '@/i18n/api-error-messages'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { useAdminAuth } from '../auth/use-admin-auth'
import { useAdminResource } from '../forms/use-admin-resource'
import { useUnsavedChangesGuard } from '../forms/use-unsaved-changes-guard'
import { FormFeedback } from '../forms/FormFeedback'
import { adminMessages as messages } from '../forms/admin.messages'
import { referenceConfig } from './reference-config'

export function ReferenceFormPage({ kind }: { kind: ReferenceKind }) {
  const { id } = useParams()
  const config = referenceConfig[kind]
  const { t } = useI18n()
  const resource = useAdminResource<ReferenceRecord>(id ? `/api/admin/${config.path}/${id}` : null)
  if (id && !resource.data) return <div className="page-gutter mx-auto max-w-[50rem] py-6"><StatusPanel tone={resource.response ? 'error' : 'info'} title={t(resource.response ? messages.loadError : messages.loading)} action={resource.response ? { label: t(commonMessages.retry), onAction: resource.retry } : undefined} /></div>
  return <ReferenceForm key={`${kind}:${id ?? 'new'}`} kind={kind} initial={resource.data} />
}
function ReferenceForm({ kind, initial }: { kind: ReferenceKind; initial: ReferenceRecord | null }) {
  const config = referenceConfig[kind]
  const { t } = useI18n()
  const { send } = useAdminAuth()
  const navigate = useNavigate()
  const [baseline, setBaseline] = useState(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [requestId] = useState(() => crypto.randomUUID())
  const [errors, setErrors] = useState<Record<string, FieldErrorCode>>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [latest, setLatest] = useState<ReferenceRecord | null>(null)
  const [pending, setPending] = useState(false)
  const sending = useRef(false)
  const form = useRef<HTMLFormElement>(null)
  const dirty = name !== (baseline?.name ?? '') || address !== (baseline?.address ?? '')
  const guard = useUnsavedChangesGuard(dirty, undefined, pending)
  const errorFor = (field: string) => errors[field] ? t(fieldErrorMessage(field, errors[field]), { field: t(field === 'name' ? messages.name : messages.address) }) : undefined
  const focusErrors = () => requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid=true]')?.focus())
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (sending.current) return
    const fields = validateReferenceFields(kind, { name, address })
    setErrors(fields)
    if (Object.keys(fields).length) { focusErrors(); return }
    sending.current = true; setPending(true); setFailure(null)
    try {
      const result = await send<ReferenceRecord>(initial ? 'PUT' : 'POST', `/api/admin/${config.path}${initial ? `/${initial.id}` : ''}`, { name, ...(kind === 'venue' ? { address } : {}), ...(initial ? { version: baseline!.version } : { createRequestId: requestId }) })
      if (result.kind === 'ok') { guard.allowNavigation(); navigate(`/admin/${config.path}`, { state: { savedId: result.data.id } }); return }
      if (result.kind === 'http') { setErrors(result.fields ?? {}); setFailure(t(apiErrorMessages[result.code] ?? apiErrorMessages.INTERNAL)); if (result.code === 'STALE_VERSION') setLatest(result.latest as ReferenceRecord); focusErrors() }
      else setFailure(t(messages.saveError))
    } finally { sending.current = false; setPending(false) }
  }
  return <div className="page-gutter mx-auto flex max-w-[50rem] flex-col gap-6 py-6"><h1 className="text-headline font-bold">{t(initial ? config.edit : config.add)}</h1>
    <form ref={form} noValidate onSubmit={submit} aria-busy={pending} className="flex flex-col gap-6">
      <TextField name="name" label={t(messages.name)} hint={t({ id: 'Maksimum 120 karakter.', en: 'Maximum 120 characters.' })} value={name} onChange={event => setName(event.target.value)} error={errorFor('name')} required />
      {kind === 'venue' && <TextField name="address" label={t(messages.address)} hint={t({ id: 'Maksimum 300 karakter.', en: 'Maximum 300 characters.' })} value={address} onChange={event => setAddress(event.target.value)} error={errorFor('address')} />}
      <FormFeedback failure={failure} latest={latest && <p>{latest.name}<br />{latest.address}</p>} yours={<p>{name}<br />{address}</p>} onReplace={() => { if (latest) { setName(latest.name); setAddress(latest.address ?? ''); setBaseline(latest); setLatest(null); setFailure(null); setErrors({}) } }} />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 border-t border-outline-variant pt-4 sm:flex sm:justify-end"><Button asChild variant="text" className="min-w-0 px-3"><Link to={`/admin/${config.path}`}>{t(messages.cancel)}</Link></Button><Button className="min-w-0 px-3 sm:min-w-40" variant="filled" type="submit" disabled={pending || Boolean(latest)} pendingLabel={pending ? t(messages.saving) : undefined}>{t(messages.save)}</Button></div>
    </form>{guard.dialog}
  </div>
}
