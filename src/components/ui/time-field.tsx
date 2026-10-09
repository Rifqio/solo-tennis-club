import { Clock } from 'lucide-react'
import { useRef, useState } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import { TextField } from './text-field'
import { Button, IconButton } from './button'
import { Sheet } from './sheet'
import { SelectField } from './select-field'

const hours = Array.from({ length: 24 }, (_, value) => ({ id: String(value).padStart(2, '0'), name: String(value).padStart(2, '0') }))
const minutes = Array.from({ length: 60 }, (_, value) => ({ id: String(value).padStart(2, '0'), name: String(value).padStart(2, '0') }))

export function TimeField({ name, label, value, onChange, error }: {
  name: string; label: string; value: string; onChange: (value: string) => void; error?: string
}) {
  const { t } = useI18n()
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('')
  const title = t({ id: 'Pilih waktu mulai (WIB)', en: 'Choose start time (WIB)' })
  const show = () => {
    const valid = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
    setHour(valid ? value.slice(0, 2) : '')
    setMinute(valid ? value.slice(3) : '')
    setOpen(true)
  }
  return <>
    <TextField name={name} label={label} value={value} onChange={event => onChange(event.target.value)}
      type="text" inputMode="numeric" placeholder="HH:mm" autoComplete="off" required error={error}
      hint={t({ id: 'Format 24 jam, misalnya 06:30. Semua waktu dalam WIB.', en: '24-hour format, for example 06:30. All times are in WIB.' })}
      trailing={<IconButton ref={trigger} label={title} aria-haspopup="dialog" aria-expanded={open} onClick={show}><Clock aria-hidden="true" className="size-6" /></IconButton>} />
    <Sheet open={open} onClose={() => setOpen(false)} title={title} description={t({ id: 'Pilih jam dan menit, lalu gunakan waktu pilihan.', en: 'Choose hours and minutes, then use the selected time.' })} closeLabel={t({ id: 'Batal', en: 'Cancel' })} returnFocus={trigger}>
      <div className="grid grid-cols-2 gap-4">
        <SelectField name="pickerHour" label={t({ id: 'Jam', en: 'Hour' })} value={hour} onChange={setHour} options={hours} placeholder="HH" />
        <SelectField name="pickerMinute" label={t({ id: 'Menit', en: 'Minute' })} value={minute} onChange={setMinute} options={minutes} placeholder="mm" />
      </div>
      <p aria-live="polite" className="text-center text-headline font-bold tabular-nums">{hour || 'HH'}:{minute || 'mm'} <span className="text-label text-on-surface-variant">WIB</span></p>
      <Button variant="filled" disabled={!hour || !minute} onClick={() => { onChange(`${hour}:${minute}`); setOpen(false) }}>{t({ id: 'Gunakan waktu', en: 'Use time' })}</Button>
    </Sheet>
  </>
}
