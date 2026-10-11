import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { VenueOption } from '@shared/api/admin-sessions'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'

const copy = {
  pick: { id: '(pilih satu)', en: '(choose one)' },
  search: { id: 'Cari lokasi atau lapangan', en: 'Search venues or courts' },
  noAddress: { id: 'Alamat belum diisi', en: 'No address yet' },
  pin: { id: 'Titik Maps', en: 'Maps pin' },
  noPin: { id: 'Belum ada titik', en: 'No pin yet' },
  noMatch: { id: 'Nggak ada lokasi "{query}".', en: 'No venue matches "{query}".' },
  addInManage: { id: 'Tambah di Kelola', en: 'Add it in Manage' },
  newVenue: { id: '+ Lokasi baru di Kelola', en: '+ New venue in Manage' },
}

// Desktop venue picker (board D10): one per class, as a searchable list showing each venue's address and whether it
// has a Maps pin. Real radio inputs, so arrows, screen readers and form focus behave as native fields do.
export function VenueList({ name, label, options, value, onChange, error, status }: {
  name: string; label: string; options: (VenueOption | { id: string; name: string })[]; value: string; onChange: (id: string) => void; error?: string; status?: ReactNode
}) {
  const { t } = useI18n()
  const id = useId()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const shown = options.filter(option => !needle || option.name.toLowerCase().includes(needle) || ('address' in option && option.address?.toLowerCase().includes(needle)))
  return (
    <fieldset data-field={name} tabIndex={-1} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className="flex min-w-0 flex-col gap-2.5 outline-none">
      <legend className="mb-2 text-label font-medium text-on-surface">{label} <span className="font-normal text-on-surface-variant">{t(copy.pick)}</span></legend>
      {status}
      {options.length > 0 && <label className="flex h-12 items-center gap-2.5 rounded-full border border-outline px-3.5 text-on-surface-variant focus-within:outline-2 focus-within:outline-primary">
        <Search aria-hidden="true" className="size-5 shrink-0" />
        <span className="sr-only">{t(copy.search)}</span>
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t(copy.search)}
          className="min-w-0 flex-1 bg-transparent text-body text-on-surface outline-none placeholder:text-on-surface-variant" />
      </label>}
      {options.length > 0 && <div className={cn('flex max-h-[14.5rem] flex-col gap-1 overflow-y-auto rounded-[1rem] border p-1.5', error ? 'border-error' : 'border-outline-variant')}>
        {shown.map(option => {
          const on = option.id === value
          const venue = 'address' in option ? option : null
          return (
            <label key={option.id} className={cn('state-layer relative grid min-h-14 cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-3 py-2 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
              on ? 'bg-band-tile text-on-signboard' : 'text-on-surface')}>
              <input type="radio" name={name} value={option.id} checked={on} onChange={() => onChange(option.id)} className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0" />
              <span aria-hidden="true" className={cn('flex size-5 items-center justify-center rounded-full border-2', on ? 'border-on-signboard' : 'border-outline')}>
                {on && <span className="size-2.5 rounded-full bg-on-signboard" />}
              </span>
              <span className="flex min-w-0 flex-col leading-snug">
                <span className="truncate font-bold">{option.name}</span>
                {venue && <span className={cn('truncate text-label', on ? 'text-on-signboard' : 'text-on-surface-variant')}>{venue.address || t(copy.noAddress)}</span>}
              </span>
              {venue && <span className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 text-label font-bold',
                on ? 'bg-surface-container-lowest text-primary' : venue.hasPin ? 'bg-primary-container text-primary' : 'bg-warning-container text-warning')}>{t(venue.hasPin ? copy.pin : copy.noPin)}</span>}
            </label>
          )
        })}
        {shown.length === 0 && <p role="status" className="p-3.5 text-on-surface-variant">{t(copy.noMatch, { query: query.trim() })} <Link to="/admin/venues" className="font-semibold text-primary underline underline-offset-4">{t(copy.addInManage)}</Link></p>}
      </div>}
      <Link to="/admin/venues/new" className="flex min-h-11 items-center self-start text-label font-semibold text-primary">{t(copy.newVenue)}</Link>
      {error && <p id={`${id}-error`} role="alert" className="text-label text-error">{error}</p>}
    </fieldset>
  )
}
