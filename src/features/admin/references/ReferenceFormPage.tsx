import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClipboardPaste, ExternalLink } from 'lucide-react'
import type { MapLocationResponse, ReferenceKind, ReferenceRecord } from '@shared/api/admin-references'
import type { FieldErrorCode } from '@shared/api/errors'
import { validateReferenceFields } from '@shared/reference-rules'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { apiErrorMessages, fieldErrorMessage } from '@/i18n/api-error-messages'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { useMediaQuery } from '@/lib/use-media-query'
import { useAdminAuth } from '../auth/use-admin-auth'
import { useAdminResource } from '../forms/use-admin-resource'
import { useUnsavedChangesGuard } from '../forms/use-unsaved-changes-guard'
import { FormFeedback } from '../forms/FormFeedback'
import { adminMessages as messages } from '../forms/admin.messages'
import { AdminBand } from '../shell/AdminBand'
import { MapPreview } from './MapPreview'
import { ReferenceDesktop } from './ReferenceDesktop'
import { referenceConfig } from './reference-config'

const copy = {
  manage: { id: 'Kelola', en: 'Manage' },
  mapLink: { id: 'Link Google Maps', en: 'Google Maps link' },
  mapHint: { id: 'Di Google Maps: buka tempatnya › Bagikan › Salin link.', en: 'In Google Maps: open the place › Share › Copy link.' },
  paste: { id: 'Tempel', en: 'Paste' },
  reading: { id: 'Membaca link...', en: 'Reading the link...' },
  found: { id: 'Titik ketemu', en: 'Pin found' },
  check: { id: 'Cek di Maps', en: 'Check in Maps' },
  remove: { id: 'Hapus titik', en: 'Remove pin' },
  readFirst: { id: 'Link belum kebaca. Tunggu sebentar atau tempel ulang.', en: 'The link has not been read yet. Wait a moment or paste it again.' },
}

type Pin = MapLocationResponse

export function ReferenceFormPage({ kind }: { kind: ReferenceKind }) {
  const { id } = useParams()
  const config = referenceConfig[kind]
  const { t } = useI18n()
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const resource = useAdminResource<ReferenceRecord>(id && !isDesktop ? `/api/admin/${config.path}/${id}` : null)
  // Desktop shows the list and this form side by side.
  if (isDesktop) return <ReferenceDesktop kind={kind} selected={id ?? 'new'} />
  if (id && !resource.data) return <>
    <AdminBand title={t(config.edit)} back={{ to: `/admin/${config.path}`, label: t(copy.manage) }} />
    <div className="page-gutter mx-auto max-w-[50rem] py-6"><StatusPanel tone={resource.response ? 'error' : 'info'} title={t(resource.response ? messages.loadError : messages.loading)} action={resource.response ? { label: t(commonMessages.retry), onAction: resource.retry } : undefined} /></div>
  </>
  return <ReferenceForm key={`${kind}:${id ?? 'new'}`} kind={kind} initial={resource.data} />
}

function pinOf(record: ReferenceRecord | null): Pin | null {
  return record?.mapUrl && record.latitude != null && record.longitude != null
    ? { mapUrl: record.mapUrl, latitude: record.latitude, longitude: record.longitude } : null
}

// `embedded`: inside the desktop Kelola card, without its own band and with the save button at the card's foot.
export function ReferenceForm({ kind, initial, embedded = false }: { kind: ReferenceKind; initial: ReferenceRecord | null; embedded?: boolean }) {
  const config = referenceConfig[kind]
  const { t } = useI18n()
  const { send } = useAdminAuth()
  const navigate = useNavigate()
  const [baseline, setBaseline] = useState(initial)
  const [name, setName] = useState(initial?.name ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [mapText, setMapText] = useState(initial?.mapUrl ?? '')
  const [pin, setPin] = useState<Pin | null>(pinOf(initial))
  const [reading, setReading] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [requestId] = useState(() => crypto.randomUUID())
  const [errors, setErrors] = useState<Record<string, FieldErrorCode>>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [latest, setLatest] = useState<ReferenceRecord | null>(null)
  const [pending, setPending] = useState(false)
  const sending = useRef(false)
  const lastRead = useRef(initial?.mapUrl ?? '')
  const form = useRef<HTMLFormElement>(null)
  const venue = kind === 'venue'
  const dirty = name !== (baseline?.name ?? '') || address !== (baseline?.address ?? '') || mapText.trim() !== (baseline?.mapUrl ?? '')
  const guard = useUnsavedChangesGuard(dirty, undefined, pending)
  const errorFor = (field: string) => errors[field] ? t(fieldErrorMessage(field, errors[field]), { field: t(field === 'name' ? messages.name : messages.address) }) : undefined
  const focusErrors = () => requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid=true]')?.focus())

  // Reads the pasted link on the server (short share links have to be followed there) and shows where it points.
  const readLink = async (text: string) => {
    const value = text.trim()
    lastRead.current = value
    setMapError(null)
    if (!value) { setPin(null); return null }
    if (pin?.mapUrl === value) return pin
    setReading(true)
    try {
      const result = await send<Pin>('POST', '/api/admin/venues/map-location', { url: value })
      if (lastRead.current !== value) return null
      if (result.kind === 'ok') { setPin(result.data); return result.data }
      setPin(null)
      setMapError(t(result.kind === 'http' ? apiErrorMessages[result.code] ?? apiErrorMessages.INTERNAL : messages.saveError))
      return null
    } finally { if (lastRead.current === value) setReading(false) }
  }
  const paste = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim()
      if (!text) return
      setMapText(text)
      void readLink(text)
    } catch { document.getElementById('venue-map')?.focus() }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (sending.current) return
    const fields = validateReferenceFields(kind, { name, address })
    setErrors(fields)
    if (Object.keys(fields).length) { focusErrors(); return }
    let mapFields = {}
    if (venue) {
      const value = mapText.trim()
      const located = value ? (pin?.mapUrl === value ? pin : await readLink(value)) : null
      if (value && !located) { setMapError(current => current ?? t(copy.readFirst)); document.getElementById('venue-map')?.focus(); return }
      mapFields = located ? { mapUrl: located.mapUrl, latitude: located.latitude, longitude: located.longitude } : { mapUrl: null, latitude: null, longitude: null }
    }
    sending.current = true; setPending(true); setFailure(null)
    try {
      const body = { name, ...(venue ? { address, ...mapFields } : {}), ...(initial ? { version: baseline!.version } : { createRequestId: requestId }) }
      const result = await send<ReferenceRecord>(initial ? 'PUT' : 'POST', `/api/admin/${config.path}${initial ? `/${initial.id}` : ''}`, body)
      if (result.kind === 'ok') { guard.allowNavigation(); navigate(`/admin/${config.path}`, { state: { savedId: result.data.id } }); return }
      if (result.kind === 'http') { setErrors(result.fields ?? {}); setFailure(t(apiErrorMessages[result.code] ?? apiErrorMessages.INTERNAL)); if (result.code === 'STALE_VERSION') setLatest(result.latest as ReferenceRecord); focusErrors() }
      else setFailure(t(messages.saveError))
    } finally { sending.current = false; setPending(false) }
  }

  const replaceWithLatest = () => {
    if (!latest) return
    setName(latest.name); setAddress(latest.address ?? ''); setMapText(latest.mapUrl ?? ''); setPin(pinOf(latest))
    setBaseline(latest); setLatest(null); setFailure(null); setErrors({})
  }

  return <>
    {!embedded && <AdminBand title={t(initial ? config.edit : config.add)} back={{ to: `/admin/${config.path}`, label: t(copy.manage) }} />}
    <form ref={form} noValidate onSubmit={submit} aria-busy={pending} className={embedded ? 'flex flex-col' : 'flex min-h-[calc(100dvh-8rem)] flex-col'}>
      <div className={embedded ? 'flex flex-col gap-5 p-6' : 'page-gutter mx-auto flex w-full max-w-[50rem] flex-1 flex-col gap-5 py-5'}>
        {embedded && <h2 className="text-headline font-bold">{t(initial ? config.edit : config.add)}</h2>}
        <TextField name="name" label={t(messages.name)} value={name} onChange={event => setName(event.target.value)} error={errorFor('name')} maxLength={120} required />
        {venue && <TextField name="address" label={t(messages.address)} value={address} onChange={event => setAddress(event.target.value)} error={errorFor('address')} maxLength={300} />}
        {venue && <div className="flex flex-col gap-3">
          <TextField id="venue-map" name="mapUrl" type="url" inputMode="url" label={t(copy.mapLink)} hint={t(copy.mapHint)} placeholder="https://maps.app.goo.gl/..."
            value={mapText} error={mapError ?? undefined} maxLength={2000}
            onChange={event => { setMapText(event.target.value); setMapError(null) }}
            onBlur={event => { if (event.target.value.trim() !== lastRead.current) void readLink(event.target.value) }}
            onPaste={event => { const text = event.clipboardData.getData('text'); if (text) requestAnimationFrame(() => void readLink(text)) }}
            trailing={<Button type="button" variant="tonal" className="px-4" onClick={() => void paste()}><ClipboardPaste aria-hidden="true" className="size-4" />{t(copy.paste)}</Button>} />
          {reading && <p role="status" className="text-label text-on-surface-variant">{t(copy.reading)}</p>}
          {pin && !reading && <section aria-label={t(copy.found)} className="overflow-hidden rounded-sm border border-outline-variant bg-surface-container-lowest">
            <MapPreview latitude={pin.latitude} longitude={pin.longitude} />
            <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3">
              <p className="flex flex-col leading-snug">
                <span className="font-semibold">{t(copy.found)}</span>
                <span className="text-label tabular-nums text-on-surface-variant">{pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}</span>
              </p>
              <div className="flex items-center gap-1">
                <Button type="button" variant="text" onClick={() => { setMapText(''); setPin(null); lastRead.current = '' }}>{t(copy.remove)}</Button>
                <Button asChild variant="outlined" className="px-4"><a href={pin.mapUrl} target="_blank" rel="noopener noreferrer">{t(copy.check)}<ExternalLink aria-hidden="true" className="size-4" /></a></Button>
              </div>
            </div>
          </section>}
        </div>}
        <FormFeedback failure={failure} latest={latest && <p>{latest.name}<br />{latest.address}</p>} yours={<p>{name}<br />{address}</p>} onReplace={replaceWithLatest} />
      </div>
      <div className={embedded ? 'border-t border-outline-variant px-6 py-4' : 'sticky bottom-0 z-10 border-t border-outline-variant bg-surface-container-lowest pb-[max(1rem,env(safe-area-inset-bottom))] pt-3'}>
        <div className={embedded ? 'flex justify-end' : 'page-gutter mx-auto w-full max-w-[50rem]'}>
          <Button className={embedded ? 'px-10' : 'w-full'} variant="filled" type="submit" disabled={pending || reading || Boolean(latest)} pendingLabel={pending ? t(messages.saving) : undefined}>
            {t(messages.save)}
          </Button>
        </div>
      </div>
    </form>
    {guard.dialog}
  </>
}
