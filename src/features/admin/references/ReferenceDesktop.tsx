import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import type { ReferenceKind, ReferenceRecord } from '@shared/api/admin-references'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { useAdminResource } from '../forms/use-admin-resource'
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

// Desktop Kelola (board D9): the list in a card on the left, the chosen record's editor on the right. Each row and
// "Tambah" are links to the same routes phones use, so saving and the unsaved-changes guard work unchanged.
// `selected` is a record id, 'new' for the blank form, or null on the list route (the saved or first record).
export function ReferenceDesktop({ kind, selected }: { kind: ReferenceKind; selected: string | null }) {
  const { t } = useI18n()
  const config = referenceConfig[kind]
  const { data, response, retry } = useAdminResource<ReferenceRecord[]>(`/api/admin/${config.path}`)
  const savedId = (useLocation().state as { savedId?: string } | null)?.savedId
  const currentId = selected ?? savedId ?? data?.[0]?.id ?? 'new'
  const record = currentId === 'new' ? null : data?.find(row => row.id === currentId) ?? null
  const venue = kind === 'venue'
  return <>
    <AdminBand title={t(copy.heading)} subtitle={<p>{t(copy.subtitle)}</p>}>
      <div className="lg:max-w-[30rem]"><ReferenceTabs current={kind} /></div>
    </AdminBand>
    <div className="page-gutter mx-auto flex w-full max-w-[72rem] items-start gap-6 py-6">
      <section aria-label={t(config.label)} className="flex w-[24rem] shrink-0 flex-col gap-3 rounded-lg bg-surface-container-lowest p-4 xl:w-[28rem]">
        <Link to={`/admin/${config.path}/new`} viewTransition aria-current={currentId === 'new' ? 'page' : undefined}
          className={cn('state-layer pressable flex min-h-12 items-center justify-center gap-2 rounded-sm font-semibold',
            currentId === 'new' ? 'bg-primary text-on-primary' : 'border border-primary text-primary')}>
          <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />{t(config.add)}
        </Link>
        {data?.some(row => row.isSample) && <SampleDataNotice />}
        {!response ? (
          <div className="flex flex-col gap-2"><p role="status" className="sr-only">{t(messages.loading)}</p>
            {[0, 1, 2].map(key => <div key={key} aria-hidden="true" className="h-14 rounded-sm bg-surface-container" />)}</div>
        ) : !data ? (
          <StatusPanel tone="error" title={t(messages.loadError)} action={{ label: t(commonMessages.retry), onAction: retry }} />
        ) : data.length === 0 ? (
          <p className="px-1 text-on-surface-variant">{t(config.empty)}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {data.map(row => {
              const active = row.id === currentId
              return (
                <li key={row.id}>
                  <Link to={`/admin/${config.path}/${row.id}/edit`} viewTransition aria-current={active ? 'page' : undefined}
                    className={cn('state-layer flex min-h-14 items-center justify-between gap-3 rounded-sm px-3.5 py-2.5 transition-colors duration-200',
                      active ? 'bg-primary text-on-primary' : 'text-on-surface')}>
                    {kind === 'coach' && <CoachAvatar name={row.name} photoUrl={row.photoUrl} />}
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="break-words font-semibold">{row.name}</span>
                      {venue && <span className={cn('self-start rounded-full px-2.5 py-0.5 text-label font-semibold',
                        active ? 'bg-surface-container-lowest text-primary' : row.mapUrl ? 'bg-secondary-container text-on-secondary-container' : 'border border-warning text-warning')}>
                        {t(row.mapUrl ? copy.pinSaved : copy.pinMissing)}</span>}
                    </span>
                    <ChevronRight aria-hidden="true" className="size-5 shrink-0" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {venue && data?.some(row => !row.mapUrl) && <p className="px-1 text-label text-on-surface-variant">{t(copy.pinNote)}</p>}
      </section>
      <div className="min-w-0 flex-1 overflow-hidden rounded-lg bg-surface-container-lowest">
        {savedId && savedId === currentId && <div className="px-6 pt-6"><StatusPanel tone="success" title={t(messages.saved)} /></div>}
        {currentId !== 'new' && !record
          ? <div className="p-6"><StatusPanel tone={response ? 'info' : 'info'} title={t(response && data ? messages.loadError : messages.loading)} /></div>
          : <ReferenceForm key={`${kind}:${currentId}`} kind={kind} initial={record} embedded />}
      </div>
    </div>
  </>
}
