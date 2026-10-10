import { useId } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// `leading` is a decorative 20px icon drawn inside the field's left edge (phone, person). `inlineAction` is a 48px icon
// button inside the right edge (show password); `trailing` sits beside the field.
export type TextFieldProps = ComponentProps<'input'> & { label: string; hint?: string; error?: string; leading?: ReactNode; inlineAction?: ReactNode; trailing?: ReactNode }

export function TextField({ label, hint, error, leading, inlineAction, trailing, id, className, ...props }: TextFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const describedBy = [hint && `${fieldId}-hint`, error && `${fieldId}-error`, props['aria-describedby']].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={fieldId} className="text-label font-medium text-on-surface">{label}</label>
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative flex min-w-0 flex-1 items-center">
          {leading && <span aria-hidden="true" className="pointer-events-none absolute left-3.5 flex size-5 items-center justify-center text-on-surface-variant">{leading}</span>}
          <input {...props} id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy}
            className={cn('min-h-12 w-full min-w-0 rounded-sm border bg-surface-container-lowest px-3 py-2 text-body text-on-surface placeholder:text-on-surface-variant', leading && 'pl-11', inlineAction && 'pr-13', error ? 'border-error' : 'border-outline', className)} />
          {inlineAction && <span className="absolute right-0 flex">{inlineAction}</span>}
        </div>
        {trailing}
      </div>
      {hint && <p id={`${fieldId}-hint`} className="text-label text-on-surface-variant">{hint}</p>}
      {error && <p id={`${fieldId}-error`} role="alert" className="text-label text-error">{error}</p>}
    </div>
  )
}
