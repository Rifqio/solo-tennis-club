import { Link, useLocation } from 'react-router-dom'
import type { ClassRecord } from '@shared/api/admin-classes'
import { useI18n } from '@/i18n/use-i18n'
import { formatIdr } from '@/i18n/format'
import { AdminRecordList } from '@/components/admin/AdminRecordList'
import { StatusPanel } from '@/components/ui/status-panel'
import { Button } from '@/components/ui/button'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { useAdminResource } from '../forms/use-admin-resource'
import { adminMessages as messages } from '../forms/admin.messages'
export function ClassListPage() {
  const { t, language } = useI18n()
  const { data, response, retry } = useAdminResource<ClassRecord[]>('/api/admin/classes')
  const location = useLocation()
  const savedId = (location.state as { savedId?: string } | null)?.savedId
  const add = <Button asChild variant="filled"><Link to="/admin/classes/new">{t({ id: 'Tambah kelas', en: 'Add class' })}</Link></Button>
  return <div className="page-gutter mx-auto flex max-w-[50rem] flex-col gap-5 py-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-headline font-bold">{t(messages.classes)}</h1>{data?.length === 0 ? null : add}</div>
    {data?.some(row => row.isSample) && <SampleDataNotice />}
    <AdminRecordList state={!response ? 'loading' : data ? 'ready' : 'error'} items={data ?? []} keyFor={row => row.id} onRetry={retry} loadingMessage={t(messages.loading)} errorMessage={t(messages.loadError)} emptyMessage={t({ id: 'Belum ada kelas. Tambahkan kelas dan nilai awalnya.', en: 'No classes yet. Add a class and its defaults.' })} addAction={add}
      renderItem={row => <div className="flex flex-col items-start gap-2 break-words py-4">
        {savedId === row.id && <StatusPanel tone="success" title={t(messages.saved)} />}
        <h2 className="text-title font-bold">{row.name}</h2><p>{row.levelName} · {row.venueName}</p>
        <p>{t(messages.duration)}: {row.defaultDurationMinutes} · {formatIdr(row.defaultPriceIdr, language)}</p>
        <p>{t(messages.min)}: {row.defaultMinParticipants} · {t(messages.max)}: {row.defaultMaxParticipants}</p>
        <ul className="flex flex-col gap-1">{row.coaches.map(coach => <li key={coach.id}>{coach.name}</li>)}</ul>
        <Button asChild variant="text"><Link to={`/admin/classes/${row.id}/edit`}>{t({ id: 'Ubah kelas', en: 'Edit class' })}<span className="sr-only">: {row.name}</span></Link></Button>
      </div>} />
  </div>
}
export const Component = ClassListPage
