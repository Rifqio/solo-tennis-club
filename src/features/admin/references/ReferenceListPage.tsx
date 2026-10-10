import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { ChevronRight, Plus } from 'lucide-react'
import type { ReferenceKind, ReferenceRecord } from '@shared/api/admin-references'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { listRowMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/use-media-query'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { useAdminList, useSettledSearch } from '../forms/use-admin-list'
import { ListMore, ListNoMatch, ListSearch } from '../forms/ListControls'
import { CoachAvatar } from '../forms/CoachAvatar'
import { AdminBand } from '../shell/AdminBand'
import { referenceConfig } from './reference-config'
import { ReferenceTabs } from './ReferenceTabs'
import { ReferenceDesktop } from './ReferenceDesktop'
import { adminMessages as messages } from '../forms/admin.messages'

const copy = {
  heading: { id: 'Kelola', en: 'Manage' },
  subtitle: { id: 'Coach, lokasi, dan level yang dipakai di sesi.', en: 'The coaches, venues and levels sessions use.' },
  pinSaved: { id: 'Titik Maps tersimpan', en: 'Maps pin saved' },
  pinMissing: { id: 'Belum ada titik Maps', en: 'No Maps pin yet' },
  noAddress: { id: 'Alamat belum diisi', en: 'No address yet' },
  pinNote: { id: 'Tanpa titik Maps, member dibawa ke pencarian nama lokasi di Google Maps.', en: 'Without a Maps pin, members get a Google Maps search for the venue name.' },
}

// Phones and tablets: the list on its own screen, 20 at a time with a server-side search; each row opens the editor.
export function ReferenceListPage({ kind }: { kind: ReferenceKind }) {
  const { t } = useI18n()
  const config = referenceConfig[kind]
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const [query, setQuery] = useState('')
  const search = useSettledSearch(query)
  const list = useAdminList<ReferenceRecord>(isDesktop ? null : `/api/admin/${config.path}`, search)
  const location = useLocation()
  const savedId = (location.state as { savedId?: string } | null)?.savedId
  const venue = kind === 'venue'
  if (isDesktop) return <ReferenceDesktop kind={kind} selected={null} />
  return <>
    <AdminBand title={t(copy.heading)} subtitle={<p>{t(copy.subtitle)}</p>}>
      <ReferenceTabs current={kind} />
    </AdminBand>
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-2.5 py-4">
      <ListSearch value={query} onChange={setQuery} label={t(config.search)} placeholder={t(config.search)} busy={list.searching} />
      {list.items.some(record => record.isSample) && <SampleDataNotice />}
      {list.status === 'loading' ? (
        <div className="flex flex-col gap-2.5"><p role="status" className="sr-only">{t(messages.loading)}</p>
          {[0, 1, 2].map(key => <div key={key} aria-hidden="true" className="h-16 rounded-sm bg-surface-container" />)}</div>
      ) : list.status === 'error' ? (
        <StatusPanel tone="error" title={t(messages.loadError)} action={{ label: t(commonMessages.retry), onAction: list.retry }} />
      ) : list.total === 0 ? (
        search ? <ListNoMatch query={search} noun={config.noun} /> : <StatusPanel tone="info" title={t(config.empty)} />
      ) : (
        <ul className="flex flex-col gap-2.5" aria-busy={list.searching}>
          <AnimatePresence initial={false} mode="popLayout">
          {list.items.map(row => (
            <m.li key={row.id} {...listRowMotion} className="flex flex-col gap-2">
              {savedId === row.id && <StatusPanel tone="success" title={t(messages.saved)} />}
              <Link to={`/admin/${config.path}/${row.id}/edit`} viewTransition
                className="state-layer flex items-center justify-between gap-3 rounded-sm bg-surface-container-lowest px-4 py-3.5">
                {kind === 'coach' && <CoachAvatar name={row.name} photoUrl={row.photoUrl} />}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <h2 title={row.name} className="truncate font-semibold">{row.name}</h2>
                  {venue && <span className="break-words text-label text-on-surface-variant">{row.address || t(copy.noAddress)}</span>}
                  {venue && <span className={cn('mt-1 self-start rounded-full px-2.5 py-0.5 text-label font-semibold',
                    row.mapUrl ? 'bg-secondary-container text-on-secondary-container' : 'border border-warning text-warning')}>{t(row.mapUrl ? copy.pinSaved : copy.pinMissing)}</span>}
                  <span className="sr-only">{t(config.edit)}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-on-surface-variant" />
              </Link>
            </m.li>
          ))}
          </AnimatePresence>
        </ul>
      )}
      <ListMore shown={list.items.length} total={list.total} hasMore={list.hasMore} loading={list.loadingMore} onMore={() => void list.loadMore()} noun={config.noun} />
      {venue && list.items.some(row => !row.mapUrl) && <p className="text-label text-on-surface-variant">{t(copy.pinNote)}</p>}
      <Link to={`/admin/${config.path}/new`} viewTransition
        className="state-layer pressable mt-1 flex min-h-13 items-center justify-center gap-2 rounded-sm border border-primary font-semibold text-primary">
        <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />{t(config.add)}
      </Link>
    </div>
  </>
}
