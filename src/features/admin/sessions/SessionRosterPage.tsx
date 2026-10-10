import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatClubTime } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { AdminRosterBooking, AdminRosterResponse } from '@shared/api/admin-roster'
import { clubDateOf } from '@shared/club-time'
import type { AdminResult } from '@/lib/admin-api'
import { useAdminAuth } from '../auth/use-admin-auth'
import { AdminBand } from '../shell/AdminBand'
import { isActive } from './roster-status'

const copy = {
  back: { id: 'Sesi', en: 'Sessions' },
  title: { id: 'Peserta', en: 'Players' },
  loading: { id: 'Memuat daftar peserta...', en: 'Loading the players...' },
  error: { id: 'Daftar peserta belum bisa dimuat.', en: 'The players could not be loaded.' },
  time: { id: 'Jam (WIB)', en: 'Time (WIB)' },
  filled: { id: 'Terisi · Min {min}', en: 'Taken · Min {min}' },
  slots: { id: '{used} / {max} slot', en: '{used} / {max} slots' },
  filter: { id: 'Saring status', en: 'Filter by status' },
  all: { id: 'Semua', en: 'All' },
  unpaid: { id: 'Belum bayar', en: 'Awaiting payment' },
  lapsed: { id: 'Lewat batas', en: 'Past deadline' },
  slot: { id: '{count} slot', en: '{count} slots' },
  deadline: { id: 'Batas {time} WIB', en: 'Due {time} WIB' },
  lapsedAt: { id: 'Lewat {time} WIB, slot dilepas', en: 'Passed {time} WIB, slots released' },
  chat: { id: 'Chat {name} di WhatsApp', en: 'Chat {name} on WhatsApp' },
  players: { id: 'Pemain', en: 'Players' },
  empty: { id: 'Belum ada yang booking sesi ini.', en: 'Nobody has booked this session yet.' },
  emptyFilter: { id: 'Nggak ada booking dengan status ini.', en: 'No bookings with this status.' },
  truncated: { id: 'Daftarnya panjang, jadi baru sebagian yang tampil.', en: 'The list is long, so only part of it is shown.' },
  cancelled: { id: 'Sesi ini dibatalkan.', en: 'This session is cancelled.' },
  edit: { id: 'Ubah sesi', en: 'Edit session' },
}

type Filter = 'all' | 'unpaid' | 'lapsed'

// wa.me takes the number as digits with the country code.
function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits.startsWith('0') ? '62' + digits.slice(1) : digits}` : null
}

// Shared with the desktop roster panel beside the day's sessions.
export function BookingGroup({ booking, active }: { booking: AdminRosterBooking; active: boolean }) {
  const { t } = useI18n()
  const href = whatsappHref(booking.bookerPhone)
  const time = formatClubTime(booking.originalDeadline)
  return (
    <article className={cn('flex flex-col gap-2.5 rounded-sm bg-surface-container-lowest px-4 py-3', !active && 'opacity-70')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="flex flex-wrap items-center gap-2">
            <span className="break-words font-bold">{booking.bookerName}</span>
            <span className="rounded-xs bg-secondary-container px-2 text-label font-bold text-on-secondary-container">{t(copy.slot, { count: booking.quantity })}</span>
          </p>
          {href
            ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={t(copy.chat, { name: booking.bookerName })}
                className="inline-flex min-h-12 items-center gap-1.5 self-start text-label font-semibold text-primary tabular-nums">
                <MessageCircle aria-hidden="true" className="size-4" />{booking.bookerPhone}
              </a>
            : <span className="text-label tabular-nums text-on-surface-variant">{booking.bookerPhone}</span>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <span className={cn('rounded-full px-2.5 py-0.5 text-label font-semibold',
            active ? 'border border-warning text-warning' : 'bg-surface-container-high text-on-surface-variant')}>{t(active ? copy.unpaid : copy.lapsed)}</span>
          <span className="text-label tabular-nums text-on-surface-variant">{t(active ? copy.deadline : copy.lapsedAt, { time })}</span>
        </div>
      </div>
      <ul aria-label={t(copy.players)} className="flex flex-wrap gap-1.5">
        {booking.participants.map(person => <li key={person.id} className="rounded-full bg-surface-container px-2.5 py-0.5 text-label">{person.name}</li>)}
      </ul>
    </article>
  )
}

export function Component() {
  const { id = '' } = useParams()
  const { get } = useAdminAuth()
  const { language, t } = useI18n()
  const [attempt, setAttempt] = useState(0)
  const [chosen, setFilter] = useState<Filter | null>(null)
  const [result, setResult] = useState<{ id: string; response: AdminResult<AdminRosterResponse> } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void get<AdminRosterResponse>(`/api/admin/sessions/${encodeURIComponent(id)}/roster`, controller.signal)
      .then(response => { if (!controller.signal.aborted) setResult({ id, response }) })
    return () => controller.abort()
  }, [get, id, attempt])
  const response = result?.id === id ? result.response : null
  const data = response?.kind === 'ok' ? response.data : null
  const retry = () => { setResult(null); setAttempt(value => value + 1) }
  const back = { to: '/admin/sessions' + (data ? `?date=${clubDateOf(new Date(data.session.date))}` : ''), label: t(copy.back) }

  if (!data) {
    return <>
      <AdminBand title={t(copy.title)} back={back} />
      <div className="page-gutter mx-auto w-full max-w-[50rem] py-4">
        {!response
          ? <><p role="status" className="sr-only">{t(copy.loading)}</p><div aria-hidden="true" className="flex flex-col gap-3">{[0, 1, 2].map(key => <div key={key} className="h-28 rounded-sm bg-surface-container" />)}</div></>
          : <StatusPanel tone="error" title={t(copy.error)} action={{ label: t(commonMessages.retry), onAction: retry }} />}
      </div>
    </>
  }

  const now = Date.parse(data.serverNow)
  const groups = data.bookings.map(booking => ({ booking, active: isActive(booking, now) }))
  const placesOf = (rows: typeof groups) => rows.reduce((sum, row) => sum + row.booking.quantity, 0)
  const counts = { all: placesOf(groups), unpaid: placesOf(groups.filter(row => row.active)), lapsed: placesOf(groups.filter(row => !row.active)) }
  // Opens on who still has to pay; lapsed bookings stay one tap away.
  const filter: Filter = chosen ?? (counts.unpaid > 0 ? 'unpaid' : 'all')
  const shown = groups.filter(row => filter === 'all' || (filter === 'unpaid') === row.active)
  const session = data.session
  const filters: Filter[] = counts.lapsed > 0 ? ['unpaid', 'lapsed', 'all'] : ['unpaid', 'all']

  return <>
    <AdminBand title={session.className} back={back}>
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-sm bg-band-tile px-3 py-2.5">
          <dt className="text-label">{formatClubDateShort(clubDateOf(new Date(session.date)), language)}</dt>
          <dd className="text-title font-bold tabular-nums">{formatClubTime(session.date)}</dd>
        </div>
        <div className="rounded-sm bg-band-tile px-3 py-2.5">
          <dt className="text-label">{t(copy.filled, { min: session.minParticipants })}</dt>
          <dd className="text-title font-bold tabular-nums">{t(copy.slots, { used: data.occupiedPlaces, max: session.maxParticipants })}</dd>
        </div>
      </dl>
    </AdminBand>
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-3 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {session.status !== 'scheduled' && <StatusPanel tone="info" title={t(copy.cancelled)} />}
      {data.bookings.length === 0 ? <StatusPanel tone="info" title={t(copy.empty)} /> : <>
        <div role="group" aria-label={t(copy.filter)} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {filters.map(value => {
            const on = filter === value
            return (
              <button key={value} type="button" aria-pressed={on} onClick={() => setFilter(value)}
                className={cn('state-layer pressable flex min-h-12 shrink-0 items-center gap-2 rounded-full pl-3.5 pr-1.5 text-label',
                  on ? 'bg-band-tile font-semibold text-on-signboard' : 'border border-outline-variant bg-surface-container-lowest')}>
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
          : <ul className="flex flex-col gap-2.5">{shown.map(row => <li key={row.booking.id}><BookingGroup {...row} /></li>)}</ul>}
      </>}
      <Button asChild variant="text" className="-ml-3 self-start"><Link to={`/admin/sessions/${id}/edit`}>{t(copy.edit)}</Link></Button>
    </div>
  </>
}
