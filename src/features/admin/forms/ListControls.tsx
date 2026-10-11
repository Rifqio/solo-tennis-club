import { Search, X } from 'lucide-react'
import { m } from 'motion/react'
import { listRowMotion } from '@/lib/motion'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'
import type { Message } from '@/i18n/types'
import { LIST_PAGE_SIZE } from '@shared/api/admin-list'

const copy = {
  clear: { id: 'Hapus pencarian', en: 'Clear search' },
  shown: { id: '{shown} dari {total} {noun}', en: '{shown} of {total} {noun}' },
  more: { id: 'Tampilkan {count} lagi', en: 'Show {count} more' },
  loading: { id: 'Memuat...', en: 'Loading...' },
  noMatch: { id: 'Nggak ada {noun} dengan nama "{query}".', en: 'No {noun} named "{query}".' },
  searching: { id: 'Mencari...', en: 'Searching...' },
}

// The search box above a paged list: filters on the server, so it finds rows that are not loaded yet.
// `busy`: the results shown still belong to the previous search; screen readers hear that a search is running.
export function ListSearch({ value, onChange, label, placeholder, busy = false }: { value: string; onChange: (value: string) => void; label: string; placeholder: string; busy?: boolean }) {
  const { t } = useI18n()
  return <>
    <label className="flex min-h-12 items-center gap-2.5 rounded-full border border-outline bg-surface-container-lowest pl-3.5 pr-1 text-on-surface-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
      <Search aria-hidden="true" className="size-5 shrink-0" />
      <span className="sr-only">{label}</span>
      <input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-body text-on-surface outline-none placeholder:text-on-surface-variant [&::-webkit-search-cancel-button]:hidden" />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label={t(copy.clear)}
          className="state-layer pressable flex size-10 shrink-0 items-center justify-center rounded-full"><X aria-hidden="true" className="size-4" /></button>
      )}
    </label>
    <span role="status" className="sr-only">{busy ? t(copy.searching) : ''}</span>
  </>
}

// The foot of a paged list: how many are showing of how many, and the next batch on request.
export function ListMore({ shown, total, hasMore, loading, onMore, noun }: { shown: number; total: number; hasMore: boolean; loading: boolean; onMore: () => void; noun: Message }) {
  const { t } = useI18n()
  if (total === 0) return null
  return (
    <div className="flex flex-col items-stretch gap-2 pt-1">
      <p className="text-center text-label text-on-surface-variant tabular-nums">{t(copy.shown, { shown, total, noun: t(noun) })}</p>
      {hasMore && (
        <Button variant="outlined" onClick={onMore} pendingLabel={loading ? t(copy.loading) : undefined}>
          {t(copy.more, { count: Math.min(LIST_PAGE_SIZE, total - shown) })}
        </Button>
      )}
    </div>
  )
}

// When a search matches nothing.
export function ListNoMatch({ query, noun }: { query: string; noun: Message }) {
  const { t } = useI18n()
  return (
    <m.p role="status" initial={listRowMotion.initial} animate={listRowMotion.animate} transition={listRowMotion.transition}
      className="rounded-sm bg-surface-container p-4 text-on-surface-variant">{t(copy.noMatch, { noun: t(noun), query: query.trim() })}</m.p>
  )
}
