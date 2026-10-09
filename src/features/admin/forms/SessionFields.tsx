import { useI18n } from '@/i18n/use-i18n'
import { SelectField } from '@/components/ui/select-field'
import { IntegerField } from '@/components/ui/integer-field'
import { CoachChecklist } from '@/components/admin/CoachChecklist'
import type { SessionOptions } from '@shared/api/admin-sessions'
import type { FieldErrorCode } from '@shared/api/errors'
import { fieldErrorMessage } from '@/i18n/api-error-messages'
import { adminMessages as messages } from './admin.messages'
import type { DefaultValues } from './form-values'
export function SessionFields({ section, values, setField, errors, options, optionsStatus = 'ready' }: { section: 'venue' | 'limits' | 'duration'; values: DefaultValues; setField: (field: keyof DefaultValues, value: string | string[]) => void; errors: Record<string, FieldErrorCode>; options: SessionOptions; optionsStatus?: 'loading' | 'error' | 'ready' }) {
  const { t } = useI18n()
  const labels = { levelId: messages.level, venueId: messages.venue, durationMinutes: messages.duration, priceIdr: messages.price, minParticipants: messages.min, maxParticipants: messages.max, coachIds: { id: 'Coach', en: 'Coaches' } }
  const errorFor = (field: keyof DefaultValues) => errors[field] ? t(fieldErrorMessage(field, errors[field]), { field: t(labels[field]) }) : undefined
  if (section === 'venue') return <>
    <SelectField name="levelId" label={t(messages.level)} value={values.levelId} onChange={value => setField('levelId', value)} options={options.levels} placeholder={t(messages.choose)} error={errorFor('levelId')} />
    <SelectField name="venueId" label={t(messages.venue)} value={values.venueId} onChange={value => setField('venueId', value)} options={options.venues} placeholder={t(messages.choose)} error={errorFor('venueId')} />
    <CoachChecklist status={optionsStatus} options={options.coaches} selectedIds={values.coachIds} onChange={value => setField('coachIds', value)} error={errorFor('coachIds')} />
  </>
  const keys = section === 'duration' ? ['durationMinutes'] as const : ['priceIdr', 'minParticipants', 'maxParticipants'] as const
  return <>{keys.map(field => <IntegerField key={field} name={field} label={t(labels[field])} value={values[field]} onChange={event => setField(field, event.target.value)} error={errorFor(field)} required hint={field === 'minParticipants' ? t({ id: 'Minimum tidak mengaktifkan pembatalan otomatis.', en: 'Minimum does not enable automatic cancellation.' }) : undefined} />)}</>
}
