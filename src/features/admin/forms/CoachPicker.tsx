import { useId, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { m } from 'motion/react'
import { Check, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { useI18n } from '@/i18n/use-i18n'
import { popSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { CoachOption } from '@shared/api/admin-sessions'
import { coachInitials } from './coach-initials'

const copy = {
  pickHint: { id: '(pilih satu atau lebih)', en: '(pick one or more)' },
  picked: { id: 'Terpilih ({count})', en: 'Picked ({count})' },
  none: { id: 'Belum ada coach. Pilih dari daftar di bawah.', en: 'No coach yet. Pick from the list below.' },
  classes: { id: '{count} kelas', en: '{count} classes' },
  noClasses: { id: 'Belum ada kelas', en: 'No classes yet' },
  seeAll: { id: 'Lihat semua coach', en: 'See all coaches' },
  more: { id: '+{count} lainnya', en: '+{count} more' },
  dialogTitle: { id: 'Pilih coach', en: 'Pick coaches' },
  dialogDescription: { id: 'Semua coach, dengan pencarian dan saringan.', en: 'Every coach, with search and filters.' },
  close: { id: 'Tutup', en: 'Close' },
  search: { id: 'Cari coach', en: 'Search coaches' },
  searchPlaceholder: { id: 'Cari nama coach', en: 'Search by coach name' },
  filter: { id: 'Saring coach', en: 'Filter coaches' },
  all: { id: 'Semua ({count})', en: 'All ({count})' },
  free: { id: 'Belum ada kelas ({count})', en: 'No classes yet ({count})' },
  noMatch: { id: 'Nggak ada coach dengan nama "{query}".', en: 'No coach named "{query}".' },
  newCoach: { id: 'Coach baru', en: 'New coach' },
  done: { id: 'Selesai', en: 'Done' },
}

// How many coach cards sit inline before the "see all" card (board D10).
const INLINE = 5

type Option = CoachOption | { id: string; name: string }
const photoOf = (option: Option) => 'photoUrl' in option ? option.photoUrl : null
const countOf = (option: Option) => 'classCount' in option ? option.classCount : 0

interface CoachPickerProps {
  name: string
  label: string
  hint?: string
  error?: string
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  // A line above the cards while options load or fail, or in place of them when there are none.
  status?: ReactNode
}

// One coach as a portrait card (photo or initials, name trimmed to one line, class count). A real checkbox covers the
// card, so keyboard, screen readers and form focus behave like the other choice fields.
function CoachCard({ option, on, name, error, onToggle }: { option: Option; on: boolean; name: string; error: boolean; onToggle: () => void }) {
  const { t } = useI18n()
  const photo = photoOf(option)
  const count = countOf(option)
  return (
    <label title={option.name}
      className={cn('group relative flex min-w-0 cursor-pointer flex-col gap-1.5 rounded-md p-1.5 transition duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
        on ? '-translate-y-0.5 bg-primary-container ring-2 ring-primary' : 'hover:bg-surface-container',
        error && !on && 'ring-1 ring-error')}>
      <input type="checkbox" name={name} value={option.id} checked={on} onChange={onToggle}
        className="absolute inset-0 z-10 size-full cursor-pointer appearance-none rounded-md opacity-0" />
      <span className="relative block aspect-[3/4] overflow-hidden rounded-sm bg-primary-container">
        {photo
          ? <img src={photo} alt="" loading="lazy" className={cn('size-full object-cover transition duration-300', !on && 'grayscale-[35%] group-hover:grayscale-0')} />
          : <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-headline font-bold text-primary">{coachInitials(option.name)}</span>}
        {on && <m.span aria-hidden="true" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={popSpring}
          className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-accent text-on-accent"><Check className="size-4" strokeWidth={3} /></m.span>}
      </span>
      <span className="flex min-w-0 flex-col px-0.5 leading-tight">
        <span className="truncate text-label font-bold">{option.name}</span>
        <span className="truncate text-label text-on-surface-variant">{count ? t(copy.classes, { count }) : t(copy.noClasses)}</span>
      </span>
    </label>
  )
}

// Coaches after the game agent-select on board D10: five portrait cards inline (picked first, then the busiest), and a
// sixth card opening every coach with search, an "only without classes" filter and a shortcut to add a coach.
export function CoachPicker({ name, label, hint, error, options, value, onChange, status }: CoachPickerProps) {
  const { t } = useI18n()
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  const toggle = (coachId: string) => onChange(value.includes(coachId) ? value.filter(item => item !== coachId) : [...value, coachId])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [onlyFree, setOnlyFree] = useState(false)
  const seeAll = useRef<HTMLButtonElement>(null)
  // The inline order is taken from the picks when the form opens and when the full list closes, so cards never jump
  // under the admin's finger while they are choosing.
  const [ranked, setRanked] = useState(value)
  const ordered = useMemo(() => [...options].sort((a, b) =>
    Number(ranked.includes(b.id)) - Number(ranked.includes(a.id)) || countOf(b) - countOf(a)), [options, ranked])
  const inline = ordered.length > INLINE + 1 ? ordered.slice(0, INLINE) : ordered
  const rest = ordered.slice(inline.length)
  const needle = query.trim().toLowerCase()
  const listed = options.filter(option => (!needle || option.name.toLowerCase().includes(needle)) && (!onlyFree || countOf(option) === 0))
  const close = () => { setOpen(false); setQuery(''); setRanked(value) }

  return (
    <fieldset data-field={name} tabIndex={-1} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className="flex min-w-0 flex-col gap-2 outline-none">
      <legend className="mb-2 text-label font-medium text-on-surface">
        {label} <span className="font-normal text-on-surface-variant">{t(copy.pickHint)}</span>
        {options.length > 0 && <> · <span className="font-bold text-primary">{value.length ? t(copy.picked, { count: value.length }) : t(copy.none)}</span></>}
      </legend>
      {status}
      {options.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {inline.map(option => <CoachCard key={option.id} option={option} on={value.includes(option.id)} name={name} error={Boolean(error)} onToggle={() => toggle(option.id)} />)}
          {rest.length > 0 && (
            <button ref={seeAll} type="button" onClick={() => setOpen(true)}
              className="state-layer pressable flex min-h-40 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-primary bg-surface-container-lowest p-2 text-center text-label font-bold text-primary">
              <span aria-hidden="true" className="flex">
                {rest.slice(0, 3).map((option, index) => (
                  <span key={option.id} className={cn('-ml-2 flex size-8 items-center justify-center overflow-hidden rounded-full border-2 border-surface-container-lowest text-label font-bold text-on-primary first:ml-0',
                    ['bg-band-tile', 'bg-band', 'bg-primary'][index])}>
                    {photoOf(option) ? <img src={photoOf(option)!} alt="" className="size-full object-cover" /> : coachInitials(option.name)}
                  </span>
                ))}
              </span>
              {t(copy.seeAll)}
              <span className="font-medium text-on-surface-variant">{t(copy.more, { count: rest.length })}</span>
            </button>
          )}
        </div>
      )}
      {hint && <p id={`${id}-hint`} className="text-label text-on-surface-variant">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-label text-error">{error}</p>}

      <Sheet open={open} onClose={close} wide closeIcon returnFocus={seeAll} title={t(copy.dialogTitle)} description={t(copy.dialogDescription)} closeLabel={t(copy.close)}
        band={<p className="text-label text-on-surface-variant">{value.length ? t(copy.picked, { count: value.length }) : t(copy.none)}</p>}
        footer={<div className="flex justify-end"><Button variant="filled" className="px-8" onClick={close}>{t(copy.done)}</Button></div>}>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-h-12 flex-[1_1_16rem] items-center gap-2.5 rounded-full border border-outline bg-surface-container-lowest px-3.5 text-on-surface-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <Search aria-hidden="true" className="size-5 shrink-0" />
            <span className="sr-only">{t(copy.search)}</span>
            <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t(copy.searchPlaceholder)}
              className="min-w-0 flex-1 bg-transparent text-body text-on-surface outline-none placeholder:text-on-surface-variant" />
          </label>
          <div role="group" aria-label={t(copy.filter)} className="flex gap-2">
            {[false, true].map(free => (
              <button key={String(free)} type="button" aria-pressed={onlyFree === free} onClick={() => setOnlyFree(free)}
                className={cn('state-layer pressable min-h-12 whitespace-nowrap rounded-full px-4 text-label font-semibold',
                  onlyFree === free ? 'bg-band-tile text-on-signboard' : 'border border-outline-variant text-on-surface')}>
                {free ? t(copy.free, { count: options.filter(option => countOf(option) === 0).length }) : t(copy.all, { count: options.length })}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(7.75rem,1fr))] gap-3.5">
          {listed.map(option => <CoachCard key={option.id} option={option} on={value.includes(option.id)} name={`${name}-all`} error={false} onToggle={() => toggle(option.id)} />)}
          <Link to="/admin/coaches/new" className="state-layer flex min-h-40 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-primary/30 p-2 text-label font-semibold text-primary">
            <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-primary-container"><Plus className="size-5" strokeWidth={2.5} /></span>
            {t(copy.newCoach)}
          </Link>
          {listed.length === 0 && <p role="status" className="col-span-full rounded-sm bg-surface-container p-4 text-on-surface-variant">{t(copy.noMatch, { query: query.trim() })}</p>}
        </div>
      </Sheet>
    </fieldset>
  )
}
