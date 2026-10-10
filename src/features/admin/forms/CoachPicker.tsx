import { useId } from 'react'
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { CoachOption } from '@shared/api/admin-sessions'
import { coachInitials } from './coach-initials'

const copy = {
  classes: { id: '{count} kelas', en: '{count} classes' },
  noClasses: { id: 'Belum ada kelas', en: 'No classes yet' },
  picked: { id: '{count} dipilih', en: '{count} picked' },
}

interface CoachPickerProps {
  name: string
  label: string
  hint?: string
  error?: string
  options: (CoachOption | { id: string; name: string })[]
  value: string[]
  onChange: (value: string[]) => void
  // A line above the cards while options load or fail, or in place of them when there are none.
  status?: ReactNode
}

// Coaches as portrait cards, after the game agent-select on board D10: photo (or initials), name and how many classes
// use them; picked cards lift with a Deep Court ring and a lime check. Each card is a real checkbox covering the card,
// so keyboard, screen readers and form focus behave like the other choice fields.
export function CoachPicker({ name, label, hint, error, options, value, onChange, status }: CoachPickerProps) {
  const { t } = useI18n()
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  const toggle = (coachId: string) => onChange(value.includes(coachId) ? value.filter(item => item !== coachId) : [...value, coachId])
  return (
    <fieldset data-field={name} tabIndex={-1} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className="flex min-w-0 flex-col gap-2 outline-none">
      <legend className="mb-2 text-label font-medium text-on-surface">
        {label}{value.length > 0 && <span className="font-bold text-primary"> · {t(copy.picked, { count: value.length })}</span>}
      </legend>
      {status}
      {options.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {options.map(option => {
            const on = value.includes(option.id)
            const photo = 'photoUrl' in option ? option.photoUrl : null
            const count = 'classCount' in option ? option.classCount : null
            return (
              <label key={option.id}
                className={cn('group relative flex cursor-pointer flex-col gap-1.5 rounded-md p-1.5 transition duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
                  on ? '-translate-y-0.5 bg-primary-container ring-2 ring-primary' : 'hover:bg-surface-container',
                  error && !on && 'ring-1 ring-error')}>
                <input type="checkbox" name={name} value={option.id} checked={on} onChange={() => toggle(option.id)}
                  className="absolute inset-0 z-10 size-full cursor-pointer appearance-none rounded-md opacity-0" />
                <span className="relative block aspect-[3/4] overflow-hidden rounded-sm bg-primary-container">
                  {photo
                    ? <img src={photo} alt="" loading="lazy" className={cn('size-full object-cover transition duration-300', !on && 'grayscale-[35%] group-hover:grayscale-0')} />
                    : <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-headline font-bold text-primary">{coachInitials(option.name)}</span>}
                  {on && <span aria-hidden="true" className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-accent text-on-accent"><Check className="size-4" strokeWidth={3} /></span>}
                </span>
                <span className="flex min-w-0 flex-col px-0.5 leading-tight">
                  <span className="break-words text-label font-bold">{option.name}</span>
                  {count !== null && <span className="text-label text-on-surface-variant">{count ? t(copy.classes, { count }) : t(copy.noClasses)}</span>}
                </span>
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
