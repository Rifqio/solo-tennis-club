import { useId, useState } from 'react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface CodeBoxesProps extends Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'maxLength'> {
  label: string
  value: string
  length?: number
  hint?: string
  error?: string
  onValueChange: (value: string) => void
}

// One real input stretched over six boxes. Typing, pasting, SMS autofill (autocomplete="one-time-code") and
// screen readers all see a normal text field; the boxes only draw what it holds.
export function CodeBoxes({ label, value, length = 6, hint, error, onValueChange, className, ...props }: CodeBoxesProps) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  const active = Math.min(value.length, length - 1)
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <div aria-hidden="true" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
          {Array.from({ length }, (_, index) => {
            const digit = value[index] ?? ''
            const current = focused && index === active
            return (
              <span
                key={index}
                className={cn(
                  'flex h-14 items-center justify-center rounded-sm bg-surface-container-lowest text-headline font-bold tabular-nums transition-colors duration-150',
                  error ? 'border border-error' : current ? 'border-2 border-primary' : digit ? 'border border-on-surface' : 'border border-outline',
                )}
              >
                {digit}
              </span>
            )
          })}
        </div>
        <input
          {...props}
          id={id}
          value={value}
          onChange={event => onValueChange(event.target.value.replace(/\D/g, '').slice(0, length))}
          onFocus={event => { setFocused(true); props.onFocus?.(event) }}
          onBlur={event => { setFocused(false); props.onBlur?.(event) }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none"
        />
      </div>
      {hint && <p id={`${id}-hint`} className="text-label text-on-surface-variant">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-label text-error">{error}</p>}
    </div>
  )
}
