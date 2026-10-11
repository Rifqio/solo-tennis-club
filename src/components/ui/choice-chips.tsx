import { useId } from 'react'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SelectionBase, SelectionMark } from '@/components/ui/selection-mark'
import { PopIn } from '@/components/ui/pop-in'

interface ChoiceChipsProps {
  name: string
  label: string
  options: { id: string; name: string }[]
  // One id for a single choice (radios), several for a multiple choice (checkboxes).
  value: string | string[]
  onChange: (value: string | string[]) => void
  hint?: string
  error?: string
  // A line above the chips while options load or fail, or in place of them when there are none.
  status?: ReactNode
}

// Choices as tappable chips: Deep Court when picked, outlined otherwise. Built on real radio or checkbox inputs, so
// keyboard, screen readers and form focus behave as native fields do. The input covers the whole chip, so taps,
// voice control and test tools reach the real control. A single choice moves one Deep Court marker to the new chip;
// in a multiple choice each chip fills on its own and its check pops in.
export function ChoiceChips({ name, label, options, value, onChange, hint, error, status }: ChoiceChipsProps) {
  const id = useId()
  const multiple = Array.isArray(value)
  const selected = (option: string) => multiple ? value.includes(option) : value === option
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <fieldset data-field={name} tabIndex={-1} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className="flex min-w-0 flex-col gap-2 outline-none">
      <legend className="mb-2 text-label font-medium text-on-surface">{label}</legend>
      {status}
      {options.length > 0 && (
        <div className="isolate flex flex-wrap gap-2">
          {options.map(option => {
            const on = selected(option.id)
            return (
              <label key={option.id}
                className={cn('selection-item pressable flex min-h-12 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-label has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
                  on ? 'font-semibold text-on-signboard' : 'text-on-surface')}>
                {on && !multiple ? <SelectionMark layoutId={`${id}-choice`} className="rounded-full bg-band-tile" />
                  : <SelectionBase className={cn('rounded-full', on ? 'bg-band-tile' : cn('border bg-surface-container-lowest', error ? 'border-error' : 'border-outline-variant'))} />}
                <input type={multiple ? 'checkbox' : 'radio'} name={name} value={option.id} checked={on} className="absolute inset-0 size-full cursor-pointer appearance-none rounded-full opacity-0"
                  onChange={event => {
                    if (!multiple) onChange(option.id)
                    else onChange(event.target.checked ? [...value, option.id] : value.filter(item => item !== option.id))
                  }} />
                {multiple && <PopIn show={on} className="flex"><Check className="size-4" strokeWidth={2.5} /></PopIn>}
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
