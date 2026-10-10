import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import type { ClassRecord } from '@shared/api/admin-classes'
import { useI18n } from '@/i18n/use-i18n'
import { useMediaQuery } from '@/lib/use-media-query'
import { formatIdr } from '@/i18n/format'
import { commonMessages } from '@/i18n/common.messages'
import { StatusPanel } from '@/components/ui/status-panel'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { useAdminResource } from '../forms/use-admin-resource'
import { adminMessages as messages } from '../forms/admin.messages'
import { AdminBand } from '../shell/AdminBand'
import { ClassDesktop } from './ClassDesktop'

const copy = {
  heading: { id: 'Kelas', en: 'Classes' },
  subtitle: { id: 'Atur sekali, tiap bikin sesi baru detailnya langsung keisi.', en: 'Set it once and every new session starts filled in.' },
  empty: { id: 'Belum ada kelas. Bikin satu dulu biar sesi gampang diisi.', en: 'No classes yet. Add one so sessions are quick to fill in.' },
  add: { id: 'Tambah kelas', en: 'Add class' },
  edit: { id: 'Ubah kelas', en: 'Edit class' },
  minutes: { id: '{count} mnt', en: '{count} min' },
  perSlot: { id: '{price} / slot', en: '{price} / slot' },
  limits: { id: 'Min {min} · Max {max}', en: 'Min {min} · Max {max}' },
  coaches: { id: 'Coach: {names}', en: 'Coaches: {names}' },
}

export function ClassListPage() {
  const { t, language } = useI18n()
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const { data, response, retry } = useAdminResource<ClassRecord[]>(isDesktop ? null : '/api/admin/classes')
  const location = useLocation()
  const savedId = (location.state as { savedId?: string } | null)?.savedId
  // Keyed by navigation so a save (which lands back on this route) reloads the list.
  if (isDesktop) return <ClassDesktop key={location.key} selected={null} />
  return <>
    <AdminBand title={t(copy.heading)} subtitle={<p>{t(copy.subtitle)}</p>} />
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-2.5 py-4 lg:max-w-[72rem]">
      {data?.some(row => row.isSample) && <SampleDataNotice />}
      {!response ? (
        <div className="flex flex-col gap-2.5"><p role="status" className="sr-only">{t(messages.loading)}</p>
          {[0, 1].map(key => <div key={key} aria-hidden="true" className="h-36 rounded-sm bg-surface-container" />)}</div>
      ) : !data ? (
        <StatusPanel tone="error" title={t(messages.loadError)} action={{ label: t(commonMessages.retry), onAction: retry }} />
      ) : data.length === 0 ? (
        <StatusPanel tone="info" title={t(copy.empty)} />
      ) : (
        <ul className="grid gap-2.5 lg:grid-cols-2">
          {data.map(row => (
            <li key={row.id} className="flex flex-col gap-2">
              {savedId === row.id && <StatusPanel tone="success" title={t(messages.saved)} />}
              <Link to={`/admin/classes/${row.id}/edit`} viewTransition className="state-layer flex flex-col gap-2.5 rounded-sm bg-surface-container-lowest px-4 py-3.5">
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
                {row.coaches.length > 0 && <span className="break-words text-label text-on-surface-variant">{t(copy.coaches, { names: row.coaches.map(coach => coach.name).join(', ') })}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link to="/admin/classes/new" viewTransition className="state-layer pressable mt-1 flex min-h-13 items-center justify-center gap-2 rounded-sm border border-primary font-semibold text-primary lg:self-start lg:px-8">
        <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />{t(copy.add)}
      </Link>
    </div>
  </>
}
export const Component = ClassListPage
