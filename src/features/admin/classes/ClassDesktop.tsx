import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, m } from 'motion/react'
import { Plus } from 'lucide-react'
import type { ClassRecord } from '@shared/api/admin-classes'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { listRowMotion, selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { useAdminResource } from '../forms/use-admin-resource'
import { useAdminList, useSettledSearch } from '../forms/use-admin-list'
import { ListMore, ListNoMatch, ListSearch } from '../forms/ListControls'
import { adminMessages as messages } from '../forms/admin.messages'
import { AdminBand } from '../shell/AdminBand'
import { coachInitials } from '../forms/coach-initials'
import { ClassForm } from './ClassFormPage'

const copy = {
  heading: { id: 'Kelas', en: 'Classes' },
  subtitle: { id: 'Atur sekali, tiap bikin sesi baru detailnya langsung keisi.', en: 'Set it once and every new session starts filled in.' },
  empty: { id: 'Belum ada kelas. Bikin satu dulu biar sesi gampang diisi.', en: 'No classes yet. Add one so sessions are quick to fill in.' },
  add: { id: 'Tambah kelas', en: 'Add class' },
  noun: { id: 'kelas', en: 'classes' },
  search: { id: 'Cari kelas', en: 'Search classes' },
  minutes: { id: '{count} mnt', en: '{count} min' },
  perSlot: { id: '{price} / slot', en: '{price} / slot' },
  limits: { id: 'Min {min} · Max {max}', en: 'Min {min} · Max {max}' },
  noCoach: { id: 'Belum ada coach', en: 'No coach yet' },
}

// Desktop Kelas (board D10): the class cards on the left, 20 at a time with a server-side search, scrolling with the
// page, and the chosen class's editor on the right. Cards and "Tambah" link to the phone routes, so saving and
// the unsaved-changes guard work unchanged. `selected` is a class id, 'new', or null on the list route (the saved
// class, else the first one).
export function ClassDesktop({ selected }: { selected: string | null }) {
  const { t, language } = useI18n()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const search = useSettledSearch(query)
  // Refetched on every navigation (a save lands back here); the last list stays on screen meanwhile.
  const list = useAdminList<ClassRecord>('/api/admin/classes', search, location.key)
  const savedId = (location.state as { savedId?: string } | null)?.savedId
  // On the list route the editor opens the first class of the unfiltered list, and keeps it while the admin searches.
  const [firstId, setFirstId] = useState<string | null>(null)
  if (!firstId && !search && list.items[0]) setFirstId(list.items[0].id)
  const currentId = selected ?? savedId ?? firstId ?? (list.status === 'ready' && !search ? 'new' : null)
  const listed = list.items.find(row => row.id === currentId)
  // A class that is not among the loaded cards (opened by link, or beyond the first page) is fetched on its own.
  const single = useAdminResource<ClassRecord>(currentId && currentId !== 'new' && !listed ? `/api/admin/classes/${currentId}` : null, location.key)
  const record = currentId === 'new' ? null : listed ?? single.data
  return <>
    <AdminBand title={t(copy.heading)} subtitle={<p>{t(copy.subtitle)}</p>}
      action={<Link to="/admin/classes/new" aria-current={currentId === 'new' ? 'page' : undefined}
        className="state-layer pressable flex min-h-12 items-center gap-2 rounded-full bg-surface-container-lowest px-5 font-semibold text-primary">
        <Plus aria-hidden="true" className="size-5" strokeWidth={2.5} />{t(copy.add)}
      </Link>} />
    <div className="desk-column flex items-start gap-5 py-5">
      <section aria-label={t(copy.heading)} className="flex min-h-[34rem] w-[24rem] shrink-0 flex-col gap-3 xl:w-[28rem]">
        <ListSearch value={query} onChange={setQuery} label={t(copy.search)} placeholder={t(copy.search)} busy={list.searching} />
        {list.items.some(row => row.isSample) && <SampleDataNotice />}
        {list.status === 'loading' ? (
          <div className="flex flex-col gap-3"><p role="status" className="sr-only">{t(messages.loading)}</p>
            {[0, 1].map(key => <div key={key} aria-hidden="true" className="appear-late h-36 rounded-lg bg-surface-container" />)}</div>
        ) : list.status === 'error' ? (
          <StatusPanel tone="error" title={t(messages.loadError)} action={{ label: t(commonMessages.retry), onAction: list.retry }} />
        ) : list.total === 0 ? (
          search ? <ListNoMatch query={search} noun={copy.noun} /> : <StatusPanel tone="info" title={t(copy.empty)} />
        ) : (
          <ul className="flex flex-col gap-3" aria-busy={list.searching}>
            <AnimatePresence initial={false} mode="popLayout">
            {list.items.map(row => {
              const active = row.id === currentId
              return (
                <m.li key={row.id} {...listRowMotion}>
                  <Link to={`/admin/classes/${row.id}/edit`} aria-current={active ? 'page' : undefined}
                    className={cn('state-layer pressable relative isolate flex flex-col gap-3 rounded-lg bg-surface-container-lowest p-4 transition-colors duration-200',
                      active ? 'text-on-primary' : 'text-on-surface')}>
                    {active && <m.span layoutId="class-card-selection" transition={selectionSpring} className="absolute inset-0 -z-10 rounded-lg bg-primary" />}
                    <span className="flex min-w-0 flex-col leading-snug">
                      <h2 className="break-words text-title font-bold">{row.name}</h2>
                      <span className={cn('break-words text-label', active ? 'text-on-primary' : 'text-on-surface-variant')}>{row.levelName} · {row.venueName}</span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {[t(copy.minutes, { count: row.defaultDurationMinutes }), t(copy.perSlot, { price: formatIdr(row.defaultPriceIdr, language) }), t(copy.limits, { min: row.defaultMinParticipants, max: row.defaultMaxParticipants })].map(fact => (
                        <span key={fact} className={cn('rounded-full px-2.5 py-0.5 text-label tabular-nums', active ? 'bg-on-primary/15' : 'bg-surface-container')}>{fact}</span>
                      ))}
                    </span>
                    <span className="flex min-w-0 items-center gap-2.5">
                      {row.coaches.length > 0 && (
                        <span aria-hidden="true" className="flex shrink-0">
                          {row.coaches.slice(0, 4).map(coach => (
                            <span key={coach.id} className={cn('-mr-2 flex size-8 items-center justify-center overflow-hidden rounded-full border-2 bg-primary-container text-label font-bold text-primary last:mr-0',
                              active ? 'border-primary' : 'border-surface-container-lowest')}>
                              {coach.photoUrl ? <img src={coach.photoUrl} alt="" loading="lazy" className="size-full object-cover" /> : coachInitials(coach.name)}
                            </span>
                          ))}
                        </span>
                      )}
                      <span title={row.coaches.map(coach => coach.name).join(', ')} className={cn('min-w-0 truncate text-label', active ? 'text-on-primary' : 'text-on-surface-variant')}>
                        {row.coaches.length ? row.coaches.map(coach => coach.name).join(', ') : t(copy.noCoach)}
                      </span>
                    </span>
                  </Link>
                </m.li>
              )
            })}
            </AnimatePresence>
          </ul>
        )}
        <ListMore failed={list.moreFailed} shown={list.items.length} total={list.total} hasMore={list.hasMore} loading={list.loadingMore} onMore={() => void list.loadMore()} noun={copy.noun} />
      </section>
      {/* The editor is taller than a screen, so it scrolls with the page rather than pinning (its save button stays reachable). */}
      <div className="min-w-0 flex-1 overflow-hidden rounded-lg bg-surface-container-lowest">
        {currentId === null || (currentId !== 'new' && !record)
          ? <div className="p-6"><StatusPanel tone={single.response && !single.data ? 'error' : 'info'} title={t(single.response && !single.data ? messages.loadError : messages.loading)} /></div>
          : <ClassForm key={`${currentId}:${record?.version ?? 0}`} initial={record} embedded />}
      </div>
    </div>
  </>
}
