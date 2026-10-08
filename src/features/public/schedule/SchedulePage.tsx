import { useEffect, useState } from 'react'
import { getJson } from '@/lib/api'
import type { ApiResult } from '@/lib/api'
import type { PublicScheduleResponse } from '@shared/api/public'
import { CLUB_TIME_ZONE } from '@shared/club-time'

const statusText = { available: 'Tersedia', nearly_full: 'Hampir penuh', full: 'Penuh', cancelled: 'Dibatalkan' }
const priceFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeZone: CLUB_TIME_ZONE })
export function SchedulePage() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<ApiResult<PublicScheduleResponse> | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void getJson<PublicScheduleResponse>('/api/public/schedule', { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setResult(value)
    })
    return () => controller.abort()
  }, [attempt])
  const retry = () => { setResult(null); setAttempt(value => value + 1) }
  return <main className="mx-auto min-h-svh max-w-3xl px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-6">
    <header className="mb-8"><p className="text-base font-semibold text-primary">Lafu · Lawu Fun Tennis Club</p><h1 className="mt-4 text-3xl font-semibold">Jadwal</h1></header>
    {result === null ? <p role="status">Memuat jadwal...</p> : result.kind !== 'ok' ? <section role="alert"><p>Jadwal belum dapat dimuat. Coba lagi.</p><button className="mt-4 min-h-12 rounded-md border border-primary px-4 focus-visible:outline-2 focus-visible:outline-offset-4" onClick={retry}>Coba lagi</button></section> : <>
      <p className="mb-6">{dateFormat.format(new Date(result.data.date + 'T12:00:00+07:00'))} · WIB</p>
      {result.data.sessions.length === 0 ? <h2 className="text-xl font-semibold">Tidak ada sesi pada tanggal ini</h2> : <ul>
        {result.data.sessions.map(session => <li key={session.id} className="border-t py-5 break-words">
          {session.isSample && <p className="mb-3 text-sm">Data contoh untuk pengujian, bukan jadwal klub.</p>}
          <p className="font-semibold">{session.startTime}–{session.endTime} WIB</p>
          <h2 className="mt-2 text-xl font-semibold">{session.className}</h2>
          <p>{session.levelName} · {session.venueName}</p>
          <p className="mt-2">{priceFormat.format(session.priceIdr)}</p>
          <p className="mt-2">Tersisa {session.remainingPlaces} tempat · {statusText[session.availability]}</p>
        </li>)}
      </ul>}
    </>}
  </main>
}
