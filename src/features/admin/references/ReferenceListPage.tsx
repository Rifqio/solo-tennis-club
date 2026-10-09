import { Link, useLocation } from 'react-router-dom'
import type { ReferenceKind, ReferenceRecord } from '@shared/api/admin-references'
import { AdminRecordList } from '@/components/admin/AdminRecordList'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { useI18n } from '@/i18n/use-i18n'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { useAdminResource } from '../forms/use-admin-resource'
import { referenceConfig } from './reference-config'
import { adminMessages as messages } from '../forms/admin.messages'
export function ReferenceListPage({ kind }: { kind: ReferenceKind }) {
  const { t } = useI18n()
  const config = referenceConfig[kind]
  const { data, response, retry } = useAdminResource<ReferenceRecord[]>(`/api/admin/${config.path}`)
  const location = useLocation()
  const savedId = (location.state as { savedId?: string } | null)?.savedId
  const add = <Button asChild variant="filled"><Link to={`/admin/${config.path}/new`}>{t(config.add)}</Link></Button>
  return <div className="page-gutter mx-auto flex max-w-[50rem] flex-col gap-5 py-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-headline font-bold">{t(config.label)}</h1>{data?.length === 0 ? null : add}</div>
    {data?.some(record => record.isSample) && <SampleDataNotice />}
    <AdminRecordList state={!response ? 'loading' : data ? 'ready' : 'error'} items={data ?? []} keyFor={row => row.id} onRetry={retry}
      loadingMessage={t(messages.loading)} errorMessage={t(messages.loadError)} emptyMessage={t(config.empty)} addAction={add}
      renderItem={row => <div className="flex flex-col items-start gap-2 py-4">
        {savedId === row.id && <StatusPanel tone="success" title={t(messages.saved)} />}
        <h2 className="break-words text-title font-bold">{row.name}</h2>{row.address && <p className="break-words text-on-surface-variant">{row.address}</p>}
        <Button asChild variant="text"><Link to={`/admin/${config.path}/${row.id}/edit`}>{t(config.edit)}<span className="sr-only">: {row.name}</span></Link></Button>
      </div>} />
  </div>
}
