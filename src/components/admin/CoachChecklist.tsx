import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/use-i18n'
import { useId } from 'react'
import { m, useReducedMotion } from 'motion/react'
export function CoachChecklist({ options, selectedIds, onChange, error, name = 'coachIds', status = 'ready' }: {
  options: { id: string; name: string }[]; selectedIds: string[]; onChange: (ids: string[]) => void; error?: string; name?: string; status?: 'loading' | 'error' | 'ready'
}) {
  const { t } = useI18n()
  const errorId = useId()
  const reduceMotion = useReducedMotion()
  const missing = selectedIds.filter(id => !options.some(option => option.id === id))
  return <fieldset data-field={name} tabIndex={-1} className="flex min-w-0 flex-col gap-2" aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}>
    <legend className="mb-2 text-label font-bold">{t({ id: 'Coach', en: 'Coaches' })}</legend>
    {status !== 'ready' && <p role="status">{t(status === 'loading' ? { id: 'Memuat coach...', en: 'Loading coaches...' } : { id: 'Coach belum dapat dimuat. Pilihan Anda tetap tersimpan.', en: 'Coaches could not be loaded. Your selections are preserved.' })}</p>}
    {status === 'ready' && !options.length && <Link className="flex min-h-12 items-center text-primary underline" to="/admin/coaches">{t({ id: 'Belum ada coach. Tambahkan coach.', en: 'No coaches yet. Add a coach.' })}</Link>}
    {[...options, ...missing.map((id, index) => ({ id, name: t(status === 'ready' ? { id: 'Coach pilihan {n} tidak tersedia', en: 'Selected coach {n} is no longer available' } : { id: 'Coach pilihan {n}: nama belum dimuat', en: 'Selected coach {n}: name not loaded yet' }, { n: index + 1 }) }))].map(option => <label key={option.id} className="state-layer flex min-h-12 cursor-pointer items-center gap-3 rounded-sm bg-surface-container-low px-3 py-2 transition-colors duration-150 has-[:checked]:bg-secondary-container has-[:disabled]:cursor-not-allowed">
      <span className="relative flex size-6 shrink-0">
        <input name={name} type="checkbox" disabled={status !== 'ready'} className="size-6 cursor-pointer appearance-none rounded-[4px] border-2 border-outline bg-surface-container-lowest transition-colors duration-150 checked:border-primary checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50" checked={selectedIds.includes(option.id)} onChange={event => onChange(event.target.checked ? [...selectedIds, option.id] : selectedIds.filter(id => id !== option.id))} />
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute inset-0 size-6 text-on-primary"><m.path d="M5 12l4 4L19 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ pathLength: selectedIds.includes(option.id) ? 1 : 0, opacity: selectedIds.includes(option.id) ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }} /></svg>
      </span>
      <span className="min-w-0 break-words">{option.name}</span>
    </label>)}
    {error && <p id={errorId} role="alert" className="text-label text-error">{error}</p>}
  </fieldset>
}
