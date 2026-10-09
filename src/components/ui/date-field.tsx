import { isClubDate } from '@shared/club-time'
import { CalendarPicker } from '@/features/public/schedule/CalendarPicker'
import { useI18n } from '@/i18n/use-i18n'
import { TextField } from './text-field'

export function DateField({ name, label, value, today, earliest, onChange, error }: {
  name: string; label: string; value: string; today: string; earliest: string; onChange: (value: string) => void; error?: string
}) {
  const { t } = useI18n()
  return <TextField name={name} label={label} value={value} onChange={event => onChange(event.target.value)}
    type="text" inputMode="numeric" placeholder="YYYY-MM-DD" autoComplete="off" required error={error}
    hint={t({ id: 'Tahun-bulan-tanggal, atau pilih dari kalender.', en: 'Year-month-day, or choose from the calendar.' })}
    trailing={<CalendarPicker selected={isClubDate(value) ? value : today} today={today} minDate={earliest} maxDate="9999-12-31" onSelect={onChange} />} />
}
