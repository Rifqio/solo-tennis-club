import { useRef, useState } from 'react'
import { ImageUp } from 'lucide-react'
import type { ReferenceRecord } from '@shared/api/admin-references'
import { COACH_PHOTO_MAX_BYTES } from '@shared/api/admin-references'
import { Button } from '@/components/ui/button'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { useI18n } from '@/i18n/use-i18n'
import { useAdminAuth } from '../auth/use-admin-auth'
import { coachInitials } from '../forms/coach-initials'
import { adminMessages as messages } from '../forms/admin.messages'
import { useToast } from '@/components/ui/use-toast'
import { FieldError } from '@/components/ui/field-error'

const copy = {
  photoSaved: { id: 'Foto tersimpan.', en: 'Photo saved.' },
  photoRemoved: { id: 'Foto dihapus.', en: 'Photo removed.' },
  label: { id: 'Foto coach', en: 'Coach photo' },
  hint: { id: 'Foto setengah badan, tegak (3:4). JPG atau PNG, maks 5 MB.', en: 'Half-body, upright (3:4). JPG or PNG, up to 5 MB.' },
  upload: { id: 'Upload foto', en: 'Upload photo' },
  replace: { id: 'Ganti foto', en: 'Replace photo' },
  remove: { id: 'Hapus foto', en: 'Remove photo' },
  uploading: { id: 'Lagi upload...', en: 'Uploading...' },
  alt: { id: 'Foto {name}', en: 'Photo of {name}' },
  tooBig: { id: 'Foto lebih dari 5 MB. Pilih foto yang lebih kecil.', en: 'The photo is over 5 MB. Choose a smaller one.' },
  wrongType: { id: 'Pilih foto JPG, PNG, atau WebP.', en: 'Choose a JPG, PNG or WebP photo.' },
  newFirst: { id: 'Simpan coach dulu, lalu tambahkan fotonya.', en: 'Save the coach first, then add a photo.' },
}
const TYPES = ['image/jpeg', 'image/png', 'image/webp']

// The coach's portrait (3:4) with upload, replace and remove. The photo saves on its own, straight away, and hands
// back the record with its new version so the name form keeps saving against the latest one.
export function CoachPhotoField({ record, name, onChange }: { record: ReferenceRecord | null; name: string; onChange: (record: ReferenceRecord) => void }) {
  const { t } = useI18n()
  const { send } = useAdminAuth()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const photoUrl = record?.photoUrl ?? null

  const run = async (request: () => ReturnType<typeof send<ReferenceRecord>>, done: string) => {
    setBusy(true); setError(null)
    try {
      const result = await request()
      if (result.kind === 'ok') { onChange(result.data); toast({ message: done }) }
      else setError(t(result.kind === 'http' ? apiErrorMessages[result.code] ?? apiErrorMessages.INTERNAL : messages.saveError))
    } finally { setBusy(false) }
  }
  const upload = (file: File | undefined) => {
    if (!file || !record) return
    if (!TYPES.includes(file.type)) { setError(t(copy.wrongType)); return }
    if (file.size > COACH_PHOTO_MAX_BYTES) { setError(t(copy.tooBig)); return }
    void run(() => send<ReferenceRecord>('PUT', `/api/admin/coaches/${record.id}/photo`, file), t(copy.photoSaved))
  }

  return (
    <div className="flex items-center gap-5">
      <span className="flex aspect-[3/4] w-[7.5rem] shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary-container">
        {photoUrl ? <img src={photoUrl} alt={t(copy.alt, { name: name || record?.name || '' })} className="size-full object-cover" />
          : <span aria-hidden="true" className="text-headline font-bold text-primary">{coachInitials(name) || '+'}</span>}
      </span>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-label font-medium">{t(copy.label)}</span>
        <span id="coach-photo-hint" className="text-label text-on-surface-variant">{t(record ? copy.hint : copy.newFirst)}</span>
        {record && <span className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept={TYPES.join(',')} className="sr-only" tabIndex={-1} aria-hidden="true"
            onChange={event => { upload(event.target.files?.[0]); event.target.value = '' }} />
          <Button variant="tonal" className="px-4" aria-describedby="coach-photo-hint" disabled={busy} pendingLabel={busy ? t(copy.uploading) : undefined} onClick={() => input.current?.click()}>
            <ImageUp aria-hidden="true" className="size-5" />{t(photoUrl ? copy.replace : copy.upload)}
          </Button>
          {photoUrl && <Button variant="text" disabled={busy} onClick={() => void run(() => send<ReferenceRecord>('DELETE', `/api/admin/coaches/${record.id}/photo`, undefined), t(copy.photoRemoved))}>{t(copy.remove)}</Button>}
        </span>}
        {error && <FieldError id="coach-photo-error">{error}</FieldError>}
      </div>
    </div>
  )
}
