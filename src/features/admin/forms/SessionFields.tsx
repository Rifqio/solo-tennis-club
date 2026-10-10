import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/use-i18n'
import { CoachPicker } from './CoachPicker'
import { VenueList } from './VenueList'
import { ChoiceChips } from '@/components/ui/choice-chips'
import { IntegerField } from '@/components/ui/integer-field'
import { StepperField } from '@/components/ui/stepper-field'
import type { SessionOptions } from '@shared/api/admin-sessions'
import type { FieldErrorCode } from '@shared/api/errors'
import { fieldErrorMessage } from '@/i18n/api-error-messages'
import { adminMessages as messages } from './admin.messages'
import type { DefaultValues } from './form-values'

const DURATIONS = ['60', '90', '120']
const OTHER = 'other'

const copy = {
  duration: { id: 'Durasi', en: 'Duration' },
  minutes: { id: '{count} mnt', en: '{count} min' },
  other: { id: 'Lainnya', en: 'Other' },
  otherMinutes: { id: 'Durasi (menit)', en: 'Duration (minutes)' },
  price: { id: 'Harga per slot', en: 'Price per slot' },
  min: { id: 'Min pemain', en: 'Min players' },
  max: { id: 'Max pemain', en: 'Max players' },
  less: { id: 'Kurangi {field}', en: 'Decrease {field}' },
  more: { id: 'Tambah {field}', en: 'Increase {field}' },
  coaches: { id: 'Coach', en: 'Coaches' },
  coachesHint: { id: 'Boleh lebih dari satu.', en: 'You can pick more than one.' },
  loading: { id: 'Memuat pilihan...', en: 'Loading the choices...' },
  failed: { id: 'Pilihan belum bisa dimuat. Isian kamu tetap aman.', en: 'The choices could not be loaded. Your entries are kept.' },
  noneCoach: { id: 'Belum ada coach. Tambah dulu di Kelola.', en: 'No coaches yet. Add one in Manage first.' },
  noneVenue: { id: 'Belum ada lokasi. Tambah dulu di Kelola.', en: 'No venues yet. Add one in Manage first.' },
  noneLevel: { id: 'Belum ada level. Tambah dulu di Kelola.', en: 'No levels yet. Add one in Manage first.' },
  missing: { id: 'Pilihan {n} sudah nggak tersedia', en: 'Choice {n} is no longer available' },
  pending: { id: 'Pilihan {n}: namanya belum dimuat', en: 'Choice {n}: name not loaded yet' },
}

type Section = 'venue' | 'level' | 'place' | 'coaches' | 'limits' | 'duration'

// The fields a class and a session share, as chips and steppers so a phone needs no dropdowns or keyboard for the
// usual values: level, venue and coaches as chips; duration as chips with an "other" entry; price; min and max.
// 'venue' is level, venue and coaches together (the session editor); 'level', 'place' and 'coaches' are the same
// fields one at a time, for screens that order them differently. `venueList`: the venue as a searchable list with
// addresses and pins (desktop class editor, board D10) instead of chips.
export function SessionFields({ section, values, setField, errors, options, optionsStatus = 'ready', venueList = false }: { section: Section; values: DefaultValues; setField: (field: keyof DefaultValues, value: string | string[]) => void; errors: Record<string, FieldErrorCode>; options: SessionOptions; optionsStatus?: 'loading' | 'error' | 'ready'; venueList?: boolean }) {
  const { t } = useI18n()
  const [customDuration, setCustomDuration] = useState(() => values.durationMinutes !== '' && !DURATIONS.includes(values.durationMinutes))
  const labels = { levelId: messages.level, venueId: messages.venue, durationMinutes: copy.duration, priceIdr: copy.price, minParticipants: copy.min, maxParticipants: copy.max, coachIds: copy.coaches }
  const errorFor = (field: keyof DefaultValues) => errors[field] ? t(fieldErrorMessage(field, errors[field]), { field: t(labels[field]) }) : undefined
  const status = (empty: { id: string; en: string }, count: number) => optionsStatus === 'loading' ? <p role="status" className="text-on-surface-variant">{t(copy.loading)}</p>
    : optionsStatus === 'error' ? <p role="status" className="text-on-surface-variant">{t(copy.failed)}</p>
    : count === 0 ? <Link to="/admin/manage" className="flex min-h-12 items-center text-primary underline underline-offset-4">{t(empty)}</Link> : undefined
  // A saved id whose option is gone still shows, so the admin sees what is selected and can change it.
  // Archived records are offered only where they are already chosen; new picks see the active ones.
  const withMissing = <T extends { id: string; name: string; archived?: boolean }>(all: T[], ids: string[]) => { const list = all.filter(option => !option.archived || ids.includes(option.id)); return [...list, ...ids.filter(id => id && !list.some(option => option.id === id)).map((id, index) => ({ id, name: t(optionsStatus === 'ready' ? copy.missing : copy.pending, { n: index + 1 }) }))] }

  const level = <ChoiceChips name="levelId" label={t(messages.level)} options={withMissing(options.levels, [values.levelId])} value={values.levelId} onChange={value => setField('levelId', value)} error={errorFor('levelId')} status={status(copy.noneLevel, options.levels.filter(option => !option.archived).length)} />
  const venueStatus = status(copy.noneVenue, options.venues.filter(option => !option.archived).length)
  const place = venueList
    ? <VenueList name="venueId" label={t(messages.venue)} options={withMissing(options.venues, [values.venueId])} value={values.venueId} onChange={value => setField('venueId', value)} error={errorFor('venueId')} status={venueStatus} />
    : <ChoiceChips name="venueId" label={t(messages.venue)} options={withMissing(options.venues, [values.venueId])} value={values.venueId} onChange={value => setField('venueId', value)} error={errorFor('venueId')} status={venueStatus} />
  const coaches = <CoachPicker name="coachIds" label={t(copy.coaches)} hint={t(copy.coachesHint)} options={withMissing(options.coaches, values.coachIds)} value={values.coachIds} onChange={value => setField('coachIds', value)} error={errorFor('coachIds')} status={status(copy.noneCoach, options.coaches.filter(option => !option.archived).length)} />
  if (section === 'venue') return <>{level}{place}{coaches}</>
  if (section === 'level') return level
  if (section === 'place') return place
  if (section === 'coaches') return coaches

  if (section === 'duration') {
    const durationOptions = [...DURATIONS.map(minutes => ({ id: minutes, name: t(copy.minutes, { count: minutes }) })), { id: OTHER, name: t(copy.other) }]
    return <>
      <ChoiceChips name="durationChoice" label={t(copy.duration)} options={durationOptions} value={customDuration ? OTHER : values.durationMinutes}
        onChange={value => { if (value === OTHER) setCustomDuration(true); else { setCustomDuration(false); setField('durationMinutes', value as string) } }}
        error={customDuration ? undefined : errorFor('durationMinutes')} />
      {customDuration && <IntegerField name="durationMinutes" label={t(copy.otherMinutes)} value={values.durationMinutes} onChange={event => setField('durationMinutes', event.target.value)} error={errorFor('durationMinutes')} required />}
    </>
  }

  return <>
    <IntegerField name="priceIdr" label={t(copy.price)} leading={<span className="text-label font-semibold">Rp</span>} value={values.priceIdr} onChange={event => setField('priceIdr', event.target.value)} error={errorFor('priceIdr')} required />
    <div className="flex gap-3">
      {(['minParticipants', 'maxParticipants'] as const).map(field => (
        <StepperField key={field} name={field} label={t(labels[field])} value={values[field]} onChange={value => setField(field, value)} min={1} max={500}
          error={errorFor(field)} decreaseLabel={t(copy.less, { field: t(labels[field]).toLowerCase() })} increaseLabel={t(copy.more, { field: t(labels[field]).toLowerCase() })} />
      ))}
    </div>
  </>
}
