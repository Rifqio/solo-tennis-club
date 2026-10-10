import { useId } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperFieldProps {
  name: string
  label: string
  // Kept as text so a half-typed or invalid entry survives until validation reports it.
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  hint?: string
  error?: string
  decreaseLabel: string
  increaseLabel: string
}

// A whole number with − and + either side. The number itself stays an editable field for big jumps.
export function StepperField({ name, label, value, onChange, min = 0, max = 999, step = 1, hint, error, decreaseLabel, increaseLabel }: StepperFieldProps) {
  const id = useId()
  const current = /^\d+$/.test(value) ? Number(value) : null
  const nudge = (direction: 1 | -1) => {
    const next = current === null ? min : current + direction * step
    onChange(String(Math.min(max, Math.max(min, next))))
  }
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  const button = 'state-layer pressable flex size-12 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface disabled:opacity-40'
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <label htmlFor={id} className="text-label font-medium text-on-surface">{label}</label>
      <div className={cn('flex items-center justify-between gap-1 rounded-sm border bg-surface-container-lowest p-1 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-1 has-[input:focus-visible]:outline-primary', error ? 'border-error' : 'border-outline-variant')}>
        <button type="button" aria-label={decreaseLabel} aria-controls={id} disabled={current !== null && current <= min} onClick={() => nudge(-1)} className={button}><Minus aria-hidden="true" className="size-4" strokeWidth={2.5} /></button>
        <input id={id} name={name} value={value} onChange={event => onChange(event.target.value.replace(/[^\d]/g, ''))}
          inputMode="numeric" pattern="[0-9]*" aria-invalid={error ? true : undefined} aria-describedby={describedBy}
          className="h-12 w-full min-w-0 bg-transparent text-center text-title font-bold tabular-nums text-on-surface outline-none" />
        <button type="button" aria-label={increaseLabel} aria-controls={id} disabled={current !== null && current >= max} onClick={() => nudge(1)} className={button}><Plus aria-hidden="true" className="size-4" strokeWidth={2.5} /></button>
      </div>
      {hint && <p id={`${id}-hint`} className="text-label text-on-surface-variant">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-label text-error">{error}</p>}
    </div>
  )
}
