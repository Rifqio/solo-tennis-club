import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { ChevronRight, Plus } from 'lucide-react'
import type { ReferenceKind, ReferenceRecord } from '@shared/api/admin-references'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { listRowMotion, selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { useAdminResource } from '../forms/use-admin-resource'
import { useAdminList, useSettledSearch } from '../forms/use-admin-list'
import { ListMore, ListNoMatch, ListSearch } from '../forms/ListControls'
import { CoachAvatar } from '../forms/CoachAvatar'
import { adminMessages as messages } from '../forms/admin.messages'
import { AdminBand } from '../shell/AdminBand'
import { referenceConfig } from './reference-config'
import { ReferenceForm } from './ReferenceFormPage'
import { ReferenceTabs } from './ReferenceTabs'

const copy = {
  heading: { id: 'Kelola', en: 'Manage' },
  subtitle: { id: 'Coach, lokasi, dan level yang dipakai di sesi.', en: 'The coaches, venues and levels sessions use.' },
  pinSaved: { id: 'Titik Maps tersimpan', en: 'Maps pin saved' },
  pinMissing: { id: 'Belum ada titik', en: 'No pin yet' },
  pinNote: { id: 'Lokasi tanpa titik Maps membawa member ke pencarian nama di Google Maps.', en: 'Venues without a Maps pin send members to a Google Maps name search.' },
}

// Desktop Kelola (board D9): the list in a card on the left, the chosen record's editor on the right. The list loads
// 20 at a time with a server-side search and scrolls with the page, while the editor stays in view. Each row and "Tambah"
// link to the routes phones use, so saving and the unsaved-changes guard work unchanged. `selected` is a record id,
// 'new' for the blank form, or null on the list route (the saved record, else the first one).
export function ReferenceDesktop({ kind, selected }: { kind: ReferenceKind; selected: string | null }) {
  const { t } = useI18n()
  const config = referenceConfig[kind]
  const location = useLocation()
  const [query, setQuery] = useState('')
  const search = useSettledSearch(query)
  // Refetched on every navigation (a save lands back here); the last list stays on screen meanwhile.
  const list = useAdminList<ReferenceRecord>(`/api/admin/${config.path}`, search, location.key)
  const savedId = (location.state as { savedId?: string } | null)?.savedId
  // On the list route the editor opens the first record of the unfiltered list, and keeps it while the admin searches.
  const [firstId, setFirstId] = useState<string | null>(null)
  if (!firstId && !search && list.items[0]) setFirstId(list.items[0].id)
  const currentId = selected ?? savedId ?? firstId ?? (list.status === 'ready' && !search ? 'new' : null)
  const listed = list.items.find(row => row.id === currentId)
  // A record that is not among the loaded rows (opened by link, or beyond the first page) is fetched on its own.
  const single = useAdminResource<ReferenceRecord>(currentId && currentId !== 'new' && !listed ? `/api/admin/${config.path}/${currentId}` : null, location.key)
  const record = currentId === 'new' ? null : listed ?? single.data
  const venue = kind === 'venue'
  return <>
    <AdminBand title={t(copy.heading)} subtitle={<p>{t(copy.subtitle)}</p>}>
      <div className="lg:max-w-[30rem]"><ReferenceTabs current={kind} /></div>
    </AdminBand>
    <div className="page-gutter mx-auto flex w-full max-w-[72rem] items-start gap-6 py-6">
      <section aria-label={t(config.label)} className="flex min-h-[34rem] w-[24rem] shrink-0 flex-col gap-3 rounded-lg bg-surface-container-lowest p-4 xl:w-[28rem]">
        <Link to={`/admin/${config.path}/new`} aria-current={currentId === 'new' ? 'page' : undefined}
          className={cn('state-layer pressable flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-sm font-semibold',
            currentId === 'new' ? 'bg-primary text-on-primary' : 'border border-primary text-primary')}>
          <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />{t(config.add)}
        </Link>
        <ListSearch value={query} onChange={setQuery} label={t(config.search)} placeholder={t(config.search)} busy={list.searching} />
        {list.items.some(row => row.isSample) && <SampleDataNotice />}
        {list.status === 'loading' ? (
          <div className="flex flex-col gap-2"><p role="status" className="sr-only">{t(messages.loading)}</p>
            {[0, 1, 2].map(key => <div key={key} aria-hidden="true" className="h-14 rounded-sm bg-surface-container" />)}</div>
        ) : list.status === 'error' ? (
          <StatusPanel tone="error" title={t(messages.loadError)} action={{ label: t(commonMessages.retry), onAction: list.retry }} />
        ) : list.total === 0 ? (
          search ? <ListNoMatch query={search} noun={config.noun} /> : <p className="px-1 text-on-surface-variant">{t(config.empty)}</p>
        ) : (
          <ul className="flex flex-col gap-1" aria-busy={list.searching}>
            <AnimatePresence initial={false} mode="popLayout">
            {list.items.map(row => {
              const active = row.id === currentId
              return (
                <m.li key={row.id} {...listRowMotion}>
                  <Link to={`/admin/${config.path}/${row.id}/edit`} aria-current={active ? 'page' : undefined}
                    className={cn('state-layer relative isolate flex min-h-14 items-center justify-between gap-3 rounded-sm px-3.5 py-2.5 transition-colors duration-200',
                      active ? 'text-on-primary' : 'text-on-surface')}>
                    {/* Picking another row is instant; only the highlight glides to it. */}
                    {active && <m.span layoutId={`reference-row-${kind}`} transition={selectionSpring} className="absolute inset-0 -z-10 rounded-sm bg-primary" />}
                    {kind === 'coach' && <CoachAvatar name={row.name} photoUrl={row.photoUrl} />}
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span title={row.name} className="truncate font-semibold">{row.name}</span>
                      {venue && <span className={cn('self-start rounded-full px-2.5 py-0.5 text-label font-semibold',
                        active ? 'bg-surface-container-lowest text-primary' : row.mapUrl ? 'bg-secondary-container text-on-secondary-container' : 'border border-warning text-warning')}>
                        {t(row.mapUrl ? copy.pinSaved : copy.pinMissing)}</span>}
                    </span>
                    <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
                  </Link>
                </m.li>
              )
            })}
            </AnimatePresence>
          </ul>
        )}
        <ListMore shown={list.items.length} total={list.total} hasMore={list.hasMore} loading={list.loadingMore} onMore={() => void list.loadMore()} noun={config.noun} />
        {venue && list.items.some(row => !row.mapUrl) && <p className="px-1 text-label text-on-surface-variant">{t(copy.pinNote)}</p>}
      </section>
      {/* The list scrolls with the page; the editor stays in view beside it. */}
      <div className="sticky top-5 min-w-0 flex-1 overflow-hidden rounded-lg bg-surface-container-lowest">
        {savedId && savedId === currentId && <div className="px-6 pt-6"><StatusPanel tone="success" title={t(messages.saved)} /></div>}
        {currentId === null || (currentId !== 'new' && !record)
          ? <div className="p-6"><StatusPanel tone={single.response && !single.data ? 'error' : 'info'} title={t(single.response && !single.data ? messages.loadError : messages.loading)} /></div>
          : <ReferenceForm key={`${kind}:${currentId}:${record?.version ?? 0}`} kind={kind} initial={record} embedded />}
      </div>
    </div>
  </>
}
