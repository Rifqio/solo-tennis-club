import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatClubTime } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { AdminRosterResponse } from '@shared/api/admin-roster'
import { clubDateOf } from '@shared/club-time'
import type { AdminResult } from '@/lib/admin-api'
import { useAdminAuth } from '../auth/use-admin-auth'
import { BookingGroup } from './SessionRosterPage'
import { isActive } from './roster-status'
import { listRowMotion, panelEnter } from '@/lib/motion'
import { SelectionBase, SelectionMark } from '@/components/ui/selection-mark'

const copy = {
  label: { id: 'Peserta', en: 'Players' },
  loading: { id: 'Memuat daftar peserta...', en: 'Loading the players...' },
  error: { id: 'Daftar peserta belum bisa dimuat.', en: 'The players could not be loaded.' },
  taken: { id: 'Terisi', en: 'Taken' },
  edit: { id: 'Ubah sesi', en: 'Edit session' },
  filter: { id: 'Saring status', en: 'Filter by status' },
  all: { id: 'Semua', en: 'All' },
  unpaid: { id: 'Belum bayar', en: 'Awaiting payment' },
  lapsed: { id: 'Lewat batas', en: 'Past deadline' },
  empty: { id: 'Belum ada yang booking sesi ini.', en: 'Nobody has booked this session yet.' },
  emptyFilter: { id: 'Nggak ada booking dengan status ini.', en: 'No bookings with this status.' },
  truncated: { id: 'Daftarnya panjang, jadi baru sebagian yang tampil.', en: 'The list is long, so only part of it is shown.' },
  cancelled: { id: 'Sesi ini dibatalkan.', en: 'This session is cancelled.' },
  release: { id: 'Lewat batas bayar, slotnya lepas sendiri.', en: 'Past the payment deadline, places are released automatically.' },
  record: { id: 'Catat booking dari WA', en: 'Record a WhatsApp booking' },
}

type Filter = 'all' | 'unpaid' | 'lapsed'

// Desktop Sesi (board D5): the chosen session's players beside the day's sessions, grouped by booking, opening on
// who still has to pay. The same booking cards as the phone roster screen.
export function RosterPanel({ id }: { id: string }) {
  const { get } = useAdminAuth()
  const { language, t } = useI18n()
  const reduceMotion = useReducedMotion()
  const [attempt, setAttempt] = useState(0)
  const [chosen, setFilter] = useState<Filter | null>(null)
  const [result, setResult] = useState<{ id: string; response: AdminResult<AdminRosterResponse> } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void get<AdminRosterResponse>(`/api/admin/sessions/${encodeURIComponent(id)}/roster`, controller.signal)
      .then(response => { if (!controller.signal.aborted) setResult({ id, response }) })
    return () => controller.abort()
  }, [get, id, attempt])
  // While the next session's roster loads, the previous one stays in place instead of flashing a loading state.
  const response = result?.response ?? null
  const data = response?.kind === 'ok' ? response.data : null
  const frame = 'sticky top-5 flex w-full flex-col overflow-hidden rounded-lg bg-surface-container-lowest'
  // The panel slides in once, when it first appears. Both branches render the same m.aside, so moving between loading,
  // error and the roster (or to another session) never runs it again.
  const enter = panelEnter(reduceMotion)

  if (!data) {
    return (
      <m.aside aria-label={t(copy.label)} {...enter} className={cn(frame, 'p-6')}>
        {!response
          ? <><p role="status" className="sr-only">{t(copy.loading)}</p><div aria-hidden="true" className="appear-late flex flex-col gap-3">{[0, 1, 2].map(key => <div key={key} className="h-20 rounded-sm bg-surface-container" />)}</div></>
          : <StatusPanel tone="error" title={t(copy.error)} action={{ label: t(commonMessages.retry), onAction: () => { setResult(null); setAttempt(value => value + 1) } }} />}
      </m.aside>
    )
  }

  const now = Date.parse(data.serverNow)
  const groups = data.bookings.map(booking => ({ booking, active: isActive(booking, now) }))
  const placesOf = (rows: typeof groups) => rows.reduce((sum, row) => sum + row.booking.quantity, 0)
  const counts = { all: placesOf(groups), unpaid: placesOf(groups.filter(row => row.active)), lapsed: placesOf(groups.filter(row => !row.active)) }
  const filter: Filter = chosen ?? (counts.unpaid > 0 ? 'unpaid' : 'all')
  const shown = groups.filter(row => filter === 'all' || (filter === 'unpaid') === row.active)
  // Board order: everyone first, then who still owes, then who lapsed.
  const filters: Filter[] = counts.lapsed > 0 ? ['all', 'unpaid', 'lapsed'] : ['all', 'unpaid']
  const { session } = data

  return (
    <m.aside aria-label={t(copy.label)} {...enter} className={frame}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant p-6">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-label font-semibold text-on-surface-variant">{t(copy.label)}</p>
          <h2 className="break-words text-headline font-bold">{session.className}</h2>
          <p className="tabular-nums text-on-surface-variant">{formatClubDateShort(clubDateOf(new Date(session.date)), language)} · {formatClubTime(session.date)} WIB</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex flex-col rounded-sm bg-primary px-3.5 py-2 leading-tight text-on-primary">
            <span className="text-label">{t(copy.taken)}</span>
            <span className="text-title font-bold tabular-nums">{data.occupiedPlaces} / {session.maxParticipants}</span>
          </span>
          <Link to={`/admin/sessions/${encodeURIComponent(id)}/edit`} viewTransition data-nav="push" className="state-layer pressable flex min-h-12 items-center rounded-sm border border-outline-variant px-4 font-semibold">{t(copy.edit)}</Link>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-6">
        {session.status !== 'scheduled' && <StatusPanel tone="info" title={t(copy.cancelled)} />}
        {data.bookings.length === 0 ? <p className="text-on-surface-variant">{t(copy.empty)}</p> : <>
          <div role="group" aria-label={t(copy.filter)} className="isolate flex flex-wrap gap-2">
            {filters.map(value => {
              const on = filter === value
              return (
                <button key={value} type="button" aria-pressed={on} onClick={() => setFilter(value)}
                  className={cn('selection-item pressable flex min-h-12 items-center gap-2 rounded-full pl-3.5 pr-1.5 text-label',
                    on && 'font-semibold text-on-signboard')}>
                  {on ? <SelectionMark layoutId="roster-filter" className="rounded-full bg-band-tile" /> : <SelectionBase className="rounded-full border border-outline-variant bg-surface-container-lowest" />}
                  {t(copy[value])}
                  <span className={cn('flex h-7 min-w-7 items-center justify-center rounded-full px-2 font-bold tabular-nums',
                    on ? 'bg-surface-container-lowest text-primary' : value === 'unpaid' ? 'bg-warning-container text-warning' : 'bg-surface-container text-on-surface-variant')}>{counts[value]}</span>
                </button>
              )
            })}
          </div>
          {data.truncated && <StatusPanel tone="info" title={t(copy.truncated)} />}
          {shown.length === 0
            ? <p className="text-on-surface-variant">{t(copy.emptyFilter)}</p>
            : <ul className="flex flex-col gap-2.5"><AnimatePresence initial={false} mode="popLayout">{shown.map(row => <m.li key={row.booking.id} {...listRowMotion} className="rounded-sm border border-outline-variant"><BookingGroup {...row} /></m.li>)}</AnimatePresence></ul>}
        </>}
      </div>
      {/* Board D5: the release rule beside the one thing to do next, recording a booking that came in on WhatsApp. */}
      {session.status === 'scheduled' && <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-6">
        <p className="text-label text-on-surface-variant">{t(copy.release)}</p>
        <Button asChild variant="filled" className="px-6">
          <Link to={`/admin/sessions/${encodeURIComponent(id)}/book`} viewTransition data-nav="push"><Plus aria-hidden="true" className="size-5" />{t(copy.record)}</Link>
        </Button>
      </div>}
    </m.aside>
  )
}
