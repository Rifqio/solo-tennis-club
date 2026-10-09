import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { formatClubDateLong, formatClubTime, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { useAdminAuth } from '../auth/use-admin-auth'
import type { AdminRosterResponse } from '@shared/api/admin-roster'

const copy = {
  title: { id: 'Daftar peserta', en: 'Session roster' },
  loading: { id: 'Memuat daftar peserta…', en: 'Loading session roster…' },
  error: { id: 'Daftar peserta belum dapat dimuat.', en: 'The roster could not be loaded.' },
  retry: { id: 'Coba lagi', en: 'Try again' },
  back: { id: 'Kembali ke sesi', en: 'Back to sessions' },
  places: { id: '{used} dari {max} slot terisi', en: '{used} of {max} slots taken' },
  left: { id: '{count} slot tersisa', en: '{count} slots left' },
  group: { id: 'Reservasi · {count} slot', en: 'Booking · {count} slots' },
  booker: { id: 'Pemesan', en: 'Booked by' },
  participants: { id: 'Nama peserta', en: 'Participants' },
  phone: { id: 'Telepon', en: 'Phone' },
  price: { id: 'Total', en: 'Total' },
  deadline: { id: 'Batas pembayaran', en: 'Payment deadline' },
  pending: { id: 'Menunggu pembayaran', en: 'Awaiting payment' },
  expired: { id: 'Kedaluwarsa', en: 'Expired' },
  empty: { id: 'Belum ada reservasi untuk sesi ini.', en: 'There are no bookings for this session yet.' },
  incomplete: { id: 'Status pembayaran tidak tersedia di tahap ini.', en: 'Payment status is not available in this phase.' },
  truncated: { id: 'Daftar panjang; sebagian reservasi ditampilkan.', en: 'This roster is long; only the first bookings are shown.' },
  sessionStatus: { id: 'Sesi dibatalkan', en: 'Session cancelled' },
}

export function Component() {
  const { id = '' } = useParams()
  const { get } = useAdminAuth()
  const { language, t } = useI18n()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ id: string; response: Awaited<ReturnType<typeof get<AdminRosterResponse>>> } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void get<AdminRosterResponse>(`/api/admin/sessions/${encodeURIComponent(id)}/roster`, controller.signal)
      .then(response => { if (!controller.signal.aborted) setResult({ id, response }) })
    return () => controller.abort()
  }, [get, id, attempt])
  const response = result?.id === id ? result.response : null
  const data = response?.kind === 'ok' ? response.data : null
  const retry = () => { setResult(null); setAttempt(value => value + 1) }
  const status = (value: string) => value === 'expired' ? copy.expired : copy.pending
  return <main className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-4 py-4 lg:max-w-[72rem]">
    <Link to="/admin/sessions" aria-label={t(copy.back)} className="state-layer -ml-3 inline-flex min-h-12 w-fit max-w-full items-center gap-2 rounded-full px-3 text-label font-bold text-primary"><ArrowLeft aria-hidden="true" className="size-5" />{t({ id: 'Sesi', en: 'Sessions' })}</Link>
    {!response ? <p role="status">{t(copy.loading)}</p> : response.kind !== 'ok' ? <StatusPanel tone="error" title={t(copy.error)} action={{ label: t(copy.retry), onAction: retry }} /> : data && <>
      {response.data.session && <header className="flex flex-col gap-3 border-b border-outline-variant pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-label font-bold uppercase tracking-wide text-primary">{t(copy.title)}</p><h1 className="text-headline font-bold">{data.session.className}</h1><p className="text-on-surface-variant">{data.session.levelName} · {formatClubDateLong(data.session.date.slice(0, 10), language)} · {formatClubTime(data.session.date)} WIB</p></div>
          <Button asChild variant="outlined"><Link to={`/admin/sessions/${id}/edit`}>{t({ id: 'Ubah sesi', en: 'Edit session' })}</Link></Button>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-label text-on-surface-variant">
          <span>{data.session.venueName}{data.session.venueAddress ? ` · ${data.session.venueAddress}` : ''}</span>
          {data.session.coaches.length > 0 && <span>{t({ id: 'Coach', en: 'Coaches' })}: {data.session.coaches.join(', ')}</span>}
          <span>{formatIdr(data.session.priceIdr, language)} {t({ id: 'per slot', en: 'per slot' })}</span>
          <span>{t({ id: 'Minimum {min} · maksimum {max}', en: 'Minimum {min} · maximum {max}' }, { min: data.session.minParticipants, max: data.session.maxParticipants })}</span>
        </div>
      </header>}
      <section aria-label={t({ id: 'Kapasitas sesi', en: 'Session capacity' })} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-container-low p-4">
        <div className="flex items-center gap-3"><Users aria-hidden="true" className="size-5 text-primary" /><div><p className="font-bold">{t(copy.places, { used: data.occupiedPlaces, max: data.session.maxParticipants })}</p><p className="text-label text-on-surface-variant">{t(copy.left, { count: data.remainingPlaces })}</p></div></div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high sm:w-40" role="progressbar" aria-label={t(copy.title)} aria-valuemin={0} aria-valuemax={data.session.maxParticipants} aria-valuenow={data.occupiedPlaces}><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, data.occupiedPlaces / Math.max(1, data.session.maxParticipants) * 100)}%` }} /></div>
      </section>
      {data.session.status !== 'scheduled' && <StatusPanel tone="info" title={t(copy.sessionStatus)} />}
      {data.bookings.length === 0 ? <StatusPanel tone="info" title={t(copy.empty)}><p>{t(copy.incomplete)}</p></StatusPanel> : <section className="flex flex-col gap-2" aria-label={t(copy.title)}>
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-title font-bold">{t(copy.title)}</h2><p className="text-label text-on-surface-variant">{data.bookings.length} {t({ id: 'reservasi', en: 'bookings' })}</p></div>
        {data.truncated && <StatusPanel tone="info" title={t(copy.truncated)} />}
        <ol className="divide-y divide-outline-variant border-y border-outline-variant">
          {data.bookings.map((booking, index) => <li key={booking.id} className="grid gap-3 py-4 md:grid-cols-[3rem_minmax(10rem,1fr)_minmax(12rem,1.2fr)_minmax(9rem,auto)] md:items-start">
            <span className="font-display text-title font-bold tabular-nums text-primary">{String(index + 1).padStart(2, '0')}</span>
            <div className="min-w-0"><p className="font-bold">{booking.bookerName}</p><p className="break-all text-label text-on-surface-variant">{booking.bookerPhone}</p></div>
            <div><p className="text-label font-bold">{t(copy.group, { count: booking.quantity })}</p><ol className="mt-1 flex flex-col gap-1">{booking.participants.map(person => <li key={person.id} className="text-body">{person.position}. {person.name}</li>)}</ol></div>
            <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end"><div className="md:text-right"><p className="text-label text-on-surface-variant">{t(copy.price)}</p><p className="font-bold tabular-nums">{formatIdr(booking.totalPriceIdr, language)}</p><p className="text-label text-on-surface-variant">{t(copy.deadline)}: {formatClubDateLong(booking.originalDeadline.slice(0, 10), language)} · {formatClubTime(booking.originalDeadline)} WIB</p></div><span className={booking.status === 'expired' ? 'rounded-sm bg-surface-container-high px-2 py-1 text-label font-bold text-on-surface-variant' : 'rounded-sm bg-warning-container px-2 py-1 text-label font-bold text-warning'}>{t(status(booking.status))}</span></div>
          </li>)}
        </ol>
      </section>}
    </>}
  </main>
}
