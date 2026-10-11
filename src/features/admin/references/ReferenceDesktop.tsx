import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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
import { archiveEmpty, referenceConfig, referenceSubline } from './reference-config'
import { ReferenceForm } from './ReferenceFormPage'
import { ReferenceTabs } from './ReferenceTabs'
import { ArchivedNotice, ArchiveHeading, ArchiveToggle } from './ArchiveControls'

const copy = {
  heading: { id: 'Kelola', en: 'Manage' },
  subtitle: { id: 'Coach, lokasi, dan level yang dipakai di kelas dan sesi.', en: 'The coaches, venues and levels classes and sessions use.' },
  pinSaved: { id: 'Titik Maps tersimpan', en: 'Maps pin saved' },
  pinMissing: { id: 'Belum ada titik', en: 'No pin yet' },
  pinNote: { id: 'Tanpa titik Maps, member dibawa ke pencarian nama lokasi di Google Maps.', en: 'Without a Maps pin, members get a Google Maps search for the venue name.' },
}

// Desktop Kelola (boards D9, D9b, D9c): the list in a card on the left, the chosen record's editor on the right. The
// list loads 20 at a time with a server-side search and scrolls with the page, while the editor stays in view. Rows and
// "Tambah" link to the routes phones use, so saving and the unsaved-changes guard work unchanged. `selected` is a record
// id, 'new' for the blank form, or null on the list route (the saved record, else the first one). `?view=archive` lists
// archived records instead.
export function ReferenceDesktop({ kind, selected }: { kind: ReferenceKind; selected: string | null }) {
  const { t } = useI18n()
  const config = referenceConfig[kind]
  const location = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const archive = params.get('view') === 'archive'
  const [query, setQuery] = useState('')
  const search = useSettledSearch(query)
  // Refetched on every navigation (a save lands back here); the last list stays on screen meanwhile.
  const list = useAdminList<ReferenceRecord>(`/api/admin/${config.path}${archive ? '?archived=1' : ''}`, search, location.key)
  const state = location.state as { savedId?: string } | null
  const savedId = state?.savedId
  // On the list route the editor opens the first record of the unfiltered list, and keeps it while the admin searches.
  const [first, setFirst] = useState<{ archive: boolean; id: string } | null>(null)
  if ((!first || first.archive !== archive) && !search && list.status === 'ready' && !list.searching && list.items[0]) setFirst({ archive, id: list.items[0].id })
  const firstId = first?.archive === archive ? first.id : null
  const currentId = selected ?? savedId ?? firstId ?? (list.status === 'ready' && !search && !archive ? 'new' : null)
  const listed = list.items.find(row => row.id === currentId)
  // A record that is not among the loaded rows (opened by link, or beyond the first page) is fetched on its own.
  const single = useAdminResource<ReferenceRecord>(currentId && currentId !== 'new' && !listed ? `/api/admin/${config.path}/${currentId}` : null, location.key)
  const record = currentId === 'new' ? null : listed ?? single.data
  const venue = kind === 'venue'
  const rowLink = (id: string) => `/admin/${config.path}/${id}/edit${archive ? '?view=archive' : ''}`
  return <>
    <AdminBand title={t(copy.heading)} subtitle={<p>{t(copy.subtitle)}</p>}>
      <div className="lg:min-w-[28rem]"><ReferenceTabs current={kind} /></div>
    </AdminBand>
    <div className="desk-column flex items-start gap-5 py-5">
      <section aria-label={t(config.label)} className="flex min-h-[36rem] w-[24rem] shrink-0 flex-col rounded-lg bg-surface-container-lowest xl:w-[28.75rem]">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
          <h2 className="text-title font-bold">{archive ? <ArchiveHeading kind={kind} /> : t(config.label)}</h2>
          {!archive && <Link to={`/admin/${config.path}/new`} aria-current={currentId === 'new' ? 'page' : undefined}
            className={cn('state-layer pressable flex min-h-11 shrink-0 items-center gap-1.5 rounded-sm px-4 font-semibold',
              currentId === 'new' ? 'bg-primary text-on-primary' : 'border border-primary text-primary')}>
            <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />{t(config.add)}
          </Link>}
        </div>
        <div className="flex flex-1 flex-col gap-3 px-3 pb-3">
          <ArchivedNotice kind={kind} />
          <div className="px-2"><ListSearch value={query} onChange={setQuery} label={t(config.search)} placeholder={t(config.search)} busy={list.searching} /></div>
          {list.items.some(row => row.isSample) && <div className="px-2"><SampleDataNotice /></div>}
          {list.status === 'loading' ? (
            <div className="flex flex-col gap-1"><p role="status" className="sr-only">{t(messages.loading)}</p>
              {[0, 1, 2].map(key => <div key={key} aria-hidden="true" className="h-16 rounded-md bg-surface-container" />)}</div>
          ) : list.status === 'error' ? (
            <StatusPanel tone="error" title={t(messages.loadError)} action={{ label: t(commonMessages.retry), onAction: list.retry }} />
          ) : list.total === 0 ? (
            search ? <ListNoMatch query={search} noun={config.noun} /> : <p className="px-2 text-on-surface-variant">{t(archive ? archiveEmpty : config.empty)}</p>
          ) : (
            <ul className="flex flex-col gap-1" aria-busy={list.searching}>
              <AnimatePresence initial={false} mode="popLayout">
              {list.items.map(row => {
                const active = row.id === currentId
                return (
                  <m.li key={row.id} {...listRowMotion}>
                    <Link to={rowLink(row.id)} aria-current={active ? 'page' : undefined}
                      className={cn('state-layer relative isolate grid min-h-16 grid-cols-[minmax(0,1fr)_auto_1.125rem] items-center gap-3 rounded-md px-3.5 py-2.5 transition-colors duration-200',
                        active ? 'text-on-primary' : 'text-on-surface')}>
                      {/* Picking another row is instant; only the highlight glides to it. */}
                      {active && <m.span layoutId={`reference-row-${kind}`} transition={selectionSpring} className="absolute inset-0 -z-10 rounded-md bg-primary" />}
                      <span className="flex min-w-0 items-center gap-3">
                        {kind === 'coach' && <CoachAvatar name={row.name} photoUrl={row.photoUrl}
                          className={cn('size-11 border-2', active ? 'border-on-primary bg-on-primary' : 'border-primary-container')} />}
                        <span className="flex min-w-0 flex-col gap-0.5 leading-snug">
                          <span title={row.name} className="truncate font-bold">{row.name}</span>
                          <span className={cn('truncate text-label', active ? 'text-on-primary' : 'text-on-surface-variant')}>{t(referenceSubline(kind, row))}</span>
                        </span>
                      </span>
                      {venue ? <span className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 text-label font-bold',
                        active ? 'bg-surface-container-lowest text-primary' : row.mapUrl ? 'bg-primary-container text-primary' : 'bg-warning-container text-warning')}>
                        {t(row.mapUrl ? copy.pinSaved : copy.pinMissing)}</span> : <span />}
                      <ChevronRight aria-hidden="true" className="size-[1.125rem]" />
                    </Link>
                  </m.li>
                )
              })}
              </AnimatePresence>
            </ul>
          )}
          <ListMore shown={list.items.length} total={list.total} hasMore={list.hasMore} loading={list.loadingMore} onMore={() => void list.loadMore()} noun={config.noun} />
          <div className="mt-auto flex flex-col gap-3">
            {venue && !archive && list.items.some(row => !row.mapUrl) && <p className="mx-2 rounded-sm bg-surface-container-low px-3.5 py-3 text-label text-on-surface-variant">{t(copy.pinNote)}</p>}
            <ArchiveToggle kind={kind} archive={archive} />
          </div>
        </div>
      </section>
      {/* The list scrolls with the page; the editor stays in view beside it. */}
      <div className="sticky top-5 flex min-h-[36rem] min-w-0 flex-1 flex-col rounded-lg bg-surface-container-lowest">
        {currentId === null || (currentId !== 'new' && !record)
          ? <div className="p-6">{archive && list.status === 'ready' && list.total === 0 && !search
            ? <p className="text-on-surface-variant">{t(archiveEmpty)}</p>
            : <StatusPanel tone={single.response && !single.data ? 'error' : 'info'} title={t(single.response && !single.data ? messages.loadError : messages.loading)} />}</div>
          : <ReferenceForm key={`${kind}:${currentId}:${record?.version ?? 0}`} kind={kind} initial={record} embedded justSaved={savedId === currentId}
            // A new photo refreshes the list (its avatar) unless the admin is mid-edit.
            onPhotoSaved={dirty => { if (!dirty) navigate(location.pathname + location.search, { replace: true }) }} />}
      </div>
    </div>
  </>
}
