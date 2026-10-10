import { Link, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { ClassRecord } from '@shared/api/admin-classes'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { useAdminResource } from '../forms/use-admin-resource'
import { adminMessages as messages } from '../forms/admin.messages'
import { AdminBand } from '../shell/AdminBand'
import { ClassForm } from './ClassFormPage'

const copy = {
  heading: { id: 'Kelas', en: 'Classes' },
  subtitle: { id: 'Atur sekali, tiap bikin sesi baru detailnya langsung keisi.', en: 'Set it once and every new session starts filled in.' },
  empty: { id: 'Belum ada kelas. Bikin satu dulu biar sesi gampang diisi.', en: 'No classes yet. Add one so sessions are quick to fill in.' },
  add: { id: 'Tambah kelas', en: 'Add class' },
  minutes: { id: '{count} mnt', en: '{count} min' },
  perSlot: { id: '{price} / slot', en: '{price} / slot' },
  limits: { id: 'Min {min} · Max {max}', en: 'Min {min} · Max {max}' },
}

// Desktop Kelas (board D10): the class cards on the left, the chosen class's editor on the right. Cards and "Tambah"
// link to the phone routes, so saving and the unsaved-changes guard work unchanged. `selected` is a class id, 'new',
// or null on the list route (the saved or first class).
export function ClassDesktop({ selected }: { selected: string | null }) {
  const { t, language } = useI18n()
  const { data, response, retry } = useAdminResource<ClassRecord[]>('/api/admin/classes')
  const savedId = (useLocation().state as { savedId?: string } | null)?.savedId
  const currentId = selected ?? savedId ?? data?.[0]?.id ?? 'new'
  const record = currentId === 'new' ? null : data?.find(row => row.id === currentId) ?? null
  return <>
    <AdminBand title={t(copy.heading)} subtitle={<p>{t(copy.subtitle)}</p>} />
    <div className="page-gutter mx-auto flex w-full max-w-[72rem] items-start gap-6 py-6">
      <section aria-label={t(copy.heading)} className="flex w-[24rem] shrink-0 flex-col gap-3 xl:w-[28rem]">
        <Link to="/admin/classes/new" viewTransition aria-current={currentId === 'new' ? 'page' : undefined}
          className={cn('state-layer pressable flex min-h-12 items-center justify-center gap-2 rounded-sm font-semibold',
            currentId === 'new' ? 'bg-primary text-on-primary' : 'border border-primary text-primary')}>
          <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />{t(copy.add)}
        </Link>
        {data?.some(row => row.isSample) && <SampleDataNotice />}
        {!response ? (
          <div className="flex flex-col gap-3"><p role="status" className="sr-only">{t(messages.loading)}</p>
            {[0, 1].map(key => <div key={key} aria-hidden="true" className="h-36 rounded-lg bg-surface-container" />)}</div>
        ) : !data ? (
          <StatusPanel tone="error" title={t(messages.loadError)} action={{ label: t(commonMessages.retry), onAction: retry }} />
        ) : data.length === 0 ? (
          <StatusPanel tone="info" title={t(copy.empty)} />
        ) : (
          <ul className="flex flex-col gap-3">
            {data.map(row => {
              const active = row.id === currentId
              return (
                <li key={row.id}>
                  <Link to={`/admin/classes/${row.id}/edit`} viewTransition aria-current={active ? 'page' : undefined}
                    className={cn('state-layer flex flex-col gap-3 rounded-lg p-4 transition-colors duration-200',
                      active ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface')}>
                    <span className="flex min-w-0 flex-col leading-snug">
                      <h2 className="break-words text-title font-bold">{row.name}</h2>
                      <span className={cn('break-words text-label', active ? 'text-on-primary' : 'text-on-surface-variant')}>{row.levelName} · {row.venueName}</span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {[t(copy.minutes, { count: row.defaultDurationMinutes }), t(copy.perSlot, { price: formatIdr(row.defaultPriceIdr, language) }), t(copy.limits, { min: row.defaultMinParticipants, max: row.defaultMaxParticipants })].map(fact => (
                        <span key={fact} className={cn('rounded-full px-2.5 py-0.5 text-label tabular-nums', active ? 'bg-on-primary/15' : 'bg-surface-container')}>{fact}</span>
                      ))}
                    </span>
                    {row.coaches.length > 0 && (
                      <span className="flex flex-wrap gap-1.5">
                        {row.coaches.map(coach => <span key={coach.id} className={cn('rounded-full border px-2.5 py-0.5 text-label', active ? 'border-on-primary/40' : 'border-outline-variant')}>{coach.name}</span>)}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <div className="min-w-0 flex-1 overflow-hidden rounded-lg bg-surface-container-lowest">
        {savedId && savedId === currentId && <div className="px-6 pt-6"><StatusPanel tone="success" title={t(messages.saved)} /></div>}
        {currentId !== 'new' && !record
          ? <div className="p-6"><StatusPanel tone="info" title={t(response && data ? messages.loadError : messages.loading)} /></div>
          : <ClassForm key={currentId} initial={record} embedded />}
      </div>
    </div>
  </>
}
