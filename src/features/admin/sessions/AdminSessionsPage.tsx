import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { AdminRecordList } from '@/components/admin/AdminRecordList'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateMedium } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { useAdminAuth } from '../auth/use-admin-auth'
import { DateStrip, TodayChip } from '@/features/public/schedule/DateStrip'
import { computeStripWindow } from '@/features/public/schedule/date-strip-window'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { SessionSummaryRow } from '@/features/public/schedule/SessionSummaryRow'
import { useNow } from '@/features/public/schedule/use-now'
import { publicScheduleWindow } from '@shared/schedule-window'
import { clubToday, isClubDate } from '@shared/club-time'
import { deriveAvailability } from '@shared/availability'
import type { AdminSessionDetail, AdminSessionListResponse } from '@shared/api/admin-sessions'
import type { AdminResult } from '@/lib/admin-api'
import { sessionsMessages } from './sessions.messages'

export function AdminSessionsPage() {
  const { get, state: auth } = useAdminAuth()
  const { language, t } = useI18n()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const savedId = (location.state as { savedId?: string } | null)?.savedId
  const param = params.get('date')
  const [result, setResult] = useState<{ date: string; response: AdminResult<AdminSessionListResponse> } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [stripStart, setStripStart] = useState<string | null>(null)
  const now = useNow()
  const today = result?.response.kind === 'ok' ? result.response.data.today : clubToday()
  const selected = isClubDate(param) ? param : today
  const data = result?.date === selected && result.response.kind === 'ok' ? result.response.data : null
  const response = result?.date === selected ? result.response : null
  const bounds = data ?? { today, ...publicScheduleWindow(today) }
  const retry = () => { setResult(null); setAttempt(value => value + 1) }
  useEffect(() => {
    if (auth.status !== 'signedIn') return
    const controller = new AbortController()
    void get<AdminSessionListResponse>(`/api/admin/sessions?date=${encodeURIComponent(selected)}`, controller.signal).then(response => {
      if (!controller.signal.aborted) setResult({ date: selected, response })
    })
    return () => controller.abort()
  }, [get, selected, attempt, auth.status])
  const listState = !response ? 'loading' : response.kind === 'ok' ? 'ready' : response.kind === 'http' && response.status === 403 ? 'forbidden' : 'error'

  return <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-4 py-4 lg:max-w-[72rem]">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-headline font-bold">{t(sessionsMessages.heading)}</h1><Button asChild variant="filled"><Link to={`/admin/sessions/new?date=${selected}`}>{t({ id: 'Tambah sesi', en: 'Add session' })}</Link></Button></div>
    {/* The date strip is drawn for the court band; until the admin shell gets its band (admin slice) it sits on a blue panel. */}
    <div className="rounded-lg bg-band px-4 pt-3 text-on-signboard [&_:focus-visible]:outline-white"><div className="flex justify-end"><TodayChip selected={selected} today={bounds.today} onSelect={date => setParams({ date }, { preventScrollReset: true })} /></div><DateStrip dates={computeStripWindow({ selected, currentStart: stripStart, ...bounds })} selected={selected} {...bounds} onSelect={date => {
      setStripStart(computeStripWindow({ selected: date, currentStart: stripStart, ...bounds })[0])
      setParams({ date }, { preventScrollReset: true })
    }} /></div>
    <h2 className="text-title font-bold">{formatClubDateMedium(selected, language)} <span className="text-label font-normal text-on-surface-variant">WIB</span></h2>
    {data?.sessions.some(row => row.isSample) && <SampleDataNotice />}
    {data?.truncated && <StatusPanel tone="info" title={t(sessionsMessages.truncated)} />}
    <AdminRecordList state={listState} items={data?.sessions ?? []} keyFor={row => row.id}
      loadingMessage={t(sessionsMessages.loading)} errorMessage={response?.kind === 'http' ? t(apiErrorMessages[response.code] ?? apiErrorMessages.INTERNAL) : t(sessionsMessages.error)} emptyMessage={t(sessionsMessages.empty)} onRetry={retry}
      addAction={<><p>{t(sessionsMessages.emptyHint)}</p>{data?.nextDate && <Button onClick={() => setParams({ date: data.nextDate! })}>{t(sessionsMessages.next)}</Button>}</>}
      renderItem={(row: AdminSessionDetail) => <div>
        {savedId === row.id && <StatusPanel tone="success" title={t({ id: 'Sesi tersimpan dan tampil di jadwal.', en: 'Session saved and visible in the schedule.' })} />}
        <SessionSummaryRow as="div" now={now} session={{
          ...row, endsAt: new Date(new Date(row.startsAt).getTime() + row.durationMinutes * 60_000).toISOString(),
          availability: deriveAvailability({ sessionStatus: row.status, maxParticipants: row.maxParticipants, remainingPlaces: row.remainingPlaces }),
        }} />
        <div className="ml-24 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 pb-4 sm:ml-28">
          <p className="break-words text-label text-on-surface-variant">{t(sessionsMessages.coaches)}: {row.coaches.length ? row.coaches.map(coach => coach.name || t(commonMessages.unavailable)).join(', ') : t(commonMessages.unavailable)}</p>
          <p className="text-label text-on-surface-variant">{t(sessionsMessages.limits, { min: row.minParticipants, max: row.maxParticipants })}</p>
          <Button asChild variant="text" className="self-start"><Link to={`/admin/sessions/${row.id}/edit`}>{t({ id: 'Ubah sesi', en: 'Edit session' })}<span className="sr-only">: {row.className}, {row.startTime}</span></Link></Button>
          <Button asChild variant="text" className="self-start"><Link to={`/admin/sessions/${row.id}/roster`}>{t({ id: 'Lihat peserta', en: 'View participants' })}<span className="sr-only">: {row.className}, {row.startTime}</span></Link></Button>
        </div>
      </div>} />
  </div>
}
