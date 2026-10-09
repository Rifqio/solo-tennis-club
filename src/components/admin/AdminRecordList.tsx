import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { authMessages } from '@/features/admin/auth/auth.messages'

export function AdminRecordList<T>({ state, items, renderItem, keyFor, loadingMessage, errorMessage, emptyMessage, onRetry, addAction }: {
  state: 'loading' | 'error' | 'forbidden' | 'ready'
  items: T[]; keyFor: (item: T) => string; renderItem: (item: T) => ReactNode
  loadingMessage: string; errorMessage: string; emptyMessage: string
  onRetry: () => void; addAction?: ReactNode
}) {
  const { t } = useI18n()
  if (state === 'forbidden') return <StatusPanel tone="error" title={t(authMessages.restricted)}><Button asChild><Link to="/admin/sign-in">{t(authMessages.heading)}</Link></Button></StatusPanel>
  if (state === 'error') return <StatusPanel tone="error" title={errorMessage} action={{ label: t(commonMessages.retry), onAction: onRetry }} />
  if (state === 'loading') return <div className="flex flex-col gap-4">
    <p role="status" className="text-on-surface-variant">{loadingMessage}</p>
    <div aria-hidden="true" className="flex flex-col divide-y divide-outline-variant">
      {[0, 1, 2].map(key => <div key={key} className="flex gap-4 py-4"><div className="h-20 w-20 shrink-0 rounded-md bg-surface-container-high" /><div className="flex flex-1 flex-col gap-3 py-1"><div className="h-5 w-3/4 rounded-xs bg-surface-container-high" /><div className="h-4 w-1/2 rounded-xs bg-surface-container-high" /></div></div>)}
    </div>
  </div>
  if (!items.length) return <StatusPanel tone="info" title={emptyMessage}>{addAction}</StatusPanel>
  return <ul className="flex flex-col divide-y divide-outline-variant">{items.map(item => <li key={keyFor(item)}>{renderItem(item)}</li>)}</ul>
}
