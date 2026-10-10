import { useId } from 'react'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChoiceChipsProps {
  name: string
  label: string
  options: { id: string; name: string }[]
  // One id for a single choice (radios), several for a multiple choice (checkboxes).
  value: string | string[]
  onChange: (value: string | string[]) => void
  hint?: string
  error?: string
  // Shown instead of the chips while options load, fail, or when there are none.
  status?: ReactNode
}

// Choices as tappable chips: Deep Court when picked, outlined otherwise. Built on real radio or checkbox inputs, so
// keyboard, screen readers and form focus behave as native fields do.
export function ChoiceChips({ name, label, options, value, onChange, hint, error, status }: ChoiceChipsProps) {
  const id = useId()
  const multiple = Array.isArray(value)
  const selected = (option: string) => multiple ? value.includes(option) : value === option
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <fieldset data-field={name} tabIndex={-1} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className="flex min-w-0 flex-col gap-2 outline-none">
      <legend className="mb-2 text-label font-medium text-on-surface">{label}</legend>
      {status ?? (
        <div className="flex flex-wrap gap-2">
          {options.map(option => {
            const on = selected(option.id)
            return (
              <label key={option.id}
                className={cn('state-layer pressable relative flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-label transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
                  on ? 'bg-band-tile font-semibold text-on-signboard' : 'border border-outline-variant bg-surface-container-lowest text-on-surface',
                  error && !on && 'border-error')}>
                <input type={multiple ? 'checkbox' : 'radio'} name={name} value={option.id} checked={on} className="sr-only"
                  onChange={event => {
                    if (!multiple) onChange(option.id)
                    else onChange(event.target.checked ? [...value, option.id] : value.filter(item => item !== option.id))
                  }} />
                {multiple && on && <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />}
                <span className="break-words">{option.name}</span>
              </label>
            )
          })}
        </div>
      )}
      {hint && <p id={`${id}-hint`} className="text-label text-on-surface-variant">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-label text-error">{error}</p>}
    </fieldset>
  )
}
