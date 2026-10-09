import { useId } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type TextFieldProps = ComponentProps<'input'> & { label: string; hint?: string; error?: string; trailing?: ReactNode }

export function TextField({ label, hint, error, trailing, id, className, ...props }: TextFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const describedBy = [hint && `${fieldId}-hint`, error && `${fieldId}-error`, props['aria-describedby']].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={fieldId} className="text-label font-bold text-on-surface">{label}</label>
      <div className="flex min-w-0 items-center gap-2">
        <input {...props} id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={describedBy}
          className={cn('min-h-12 w-full min-w-0 rounded-sm border bg-surface-container-lowest px-3 py-2 text-body text-on-surface placeholder:text-on-surface-variant', error ? 'border-error' : 'border-outline', className)} />
        {trailing}
      </div>
      {hint && <p id={`${fieldId}-hint`} className="text-label text-on-surface-variant">{hint}</p>}
      {error && <p id={`${fieldId}-error`} role="alert" className="text-label text-error">{error}</p>}
    </div>
  )
}
