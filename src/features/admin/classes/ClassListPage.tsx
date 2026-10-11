import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { ChevronRight, Plus } from 'lucide-react'
import type { ClassRecord } from '@shared/api/admin-classes'
import { useI18n } from '@/i18n/use-i18n'
import { listRowMotion } from '@/lib/motion'
import { formatIdr } from '@/i18n/format'
import { commonMessages } from '@/i18n/common.messages'
import { StatusPanel } from '@/components/ui/status-panel'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { useAdminList, useSettledSearch } from '../forms/use-admin-list'
import { ListMore, ListNoMatch, ListSearch } from '../forms/ListControls'
import { adminMessages as messages } from '../forms/admin.messages'
import { AdminBand } from '../shell/AdminBand'
import { SavedNote } from '@/components/ui/saved-note'

const copy = {
  heading: { id: 'Kelas', en: 'Classes' },
  subtitle: { id: 'Atur sekali, tiap bikin sesi baru detailnya langsung keisi.', en: 'Set it once and every new session starts filled in.' },
  empty: { id: 'Belum ada kelas. Bikin satu dulu biar sesi gampang diisi.', en: 'No classes yet. Add one so sessions are quick to fill in.' },
  add: { id: 'Tambah kelas', en: 'Add class' },
  edit: { id: 'Ubah kelas', en: 'Edit class' },
  noun: { id: 'kelas', en: 'classes' },
  search: { id: 'Cari kelas', en: 'Search classes' },
  minutes: { id: '{count} mnt', en: '{count} min' },
  perSlot: { id: '{price} / slot', en: '{price} / slot' },
  limits: { id: 'Min {min} · Max {max}', en: 'Min {min} · Max {max}' },
  coaches: { id: 'Coach: {names}', en: 'Coaches: {names}' },
}

// Phones and tablets: the class cards on their own screen, 20 at a time with a server-side search.
export function ClassListPage() {
  const { t, language } = useI18n()
  const [query, setQuery] = useState('')
  const search = useSettledSearch(query)
  const list = useAdminList<ClassRecord>('/api/admin/classes', search)
  const location = useLocation()
  const savedId = (location.state as { savedId?: string } | null)?.savedId
  return <>
    <AdminBand title={t(copy.heading)} subtitle={<p>{t(copy.subtitle)}</p>} />
    <div className="page-gutter desk-column mx-auto flex w-full max-w-[50rem] flex-col gap-2.5 py-4">
      <ListSearch value={query} onChange={setQuery} label={t(copy.search)} placeholder={t(copy.search)} busy={list.searching} />
      {list.items.some(row => row.isSample) && <SampleDataNotice />}
      {list.status === 'loading' ? (
        <div className="flex flex-col gap-2.5"><p role="status" className="sr-only">{t(messages.loading)}</p>
          {[0, 1].map(key => <div key={key} aria-hidden="true" className="appear-late h-36 rounded-sm bg-surface-container" />)}</div>
      ) : list.status === 'error' ? (
        <StatusPanel tone="error" title={t(messages.loadError)} action={{ label: t(commonMessages.retry), onAction: list.retry }} />
      ) : list.total === 0 ? (
        search ? <ListNoMatch query={search} noun={copy.noun} /> : <StatusPanel tone="info" title={t(copy.empty)} />
      ) : (
        <ul className="grid gap-2.5 lg:grid-cols-2" aria-busy={list.searching}>
          <AnimatePresence initial={false} mode="popLayout">
          {list.items.map(row => (
            <m.li key={row.id} {...listRowMotion} className="flex flex-col gap-2">
              {savedId === row.id && <SavedNote><StatusPanel tone="success" title={t(messages.saved)} /></SavedNote>}
              <Link to={`/admin/classes/${row.id}/edit`} viewTransition className="state-layer pressable flex flex-col gap-2.5 rounded-sm bg-surface-container-lowest px-4 py-3.5">
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 flex-col leading-snug">
                    <h2 className="break-words font-bold">{row.name}</h2><span className="sr-only">{t(copy.edit)}</span>
                    <span className="break-words text-label text-on-surface-variant">{row.levelName} · {row.venueName}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-on-surface-variant" />
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {[t(copy.minutes, { count: row.defaultDurationMinutes }), t(copy.perSlot, { price: formatIdr(row.defaultPriceIdr, language) }), t(copy.limits, { min: row.defaultMinParticipants, max: row.defaultMaxParticipants })].map(fact => (
                    <span key={fact} className="rounded-full bg-surface-container px-2.5 py-0.5 text-label tabular-nums">{fact}</span>
                  ))}
                </span>
                {row.coaches.length > 0 && <span title={row.coaches.map(coach => coach.name).join(', ')} className="truncate text-label text-on-surface-variant">{t(copy.coaches, { names: row.coaches.map(coach => coach.name).join(', ') })}</span>}
              </Link>
            </m.li>
          ))}
          </AnimatePresence>
        </ul>
      )}
      <ListMore shown={list.items.length} total={list.total} hasMore={list.hasMore} loading={list.loadingMore} onMore={() => void list.loadMore()} noun={copy.noun} />
      <Link to="/admin/classes/new" viewTransition className="state-layer pressable mt-1 flex min-h-13 items-center justify-center gap-2 rounded-sm border border-primary font-semibold text-primary lg:self-start lg:px-8">
        <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />{t(copy.add)}
      </Link>
    </div>
  </>
}
export const Component = ClassListPage
