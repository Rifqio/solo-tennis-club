import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import { StatusPanel } from '@/components/ui/status-panel'
import { Button } from '@/components/ui/button'
import { adminMessages as messages } from './admin.messages'
export function FormFeedback({ failure, latest, onReplace, yours }: { failure: string | null; latest?: ReactNode; yours?: ReactNode; onReplace?: () => void }) {
  const { t } = useI18n()
  return <>{failure && <StatusPanel tone="error" title={failure} />}{latest && <section aria-label={t(messages.conflict)} className="flex flex-col gap-4 rounded-md bg-surface-container p-4">
    <p className="font-bold">{t(messages.conflict)}</p><div className="grid gap-4 sm:grid-cols-2"><div className="min-w-0 break-words"><h2 className="font-bold">{t(messages.latest)}</h2>{latest}</div><div className="min-w-0 break-words"><h2 className="font-bold">{t(messages.yours)}</h2>{yours}</div></div>
    <Button variant="outlined" onClick={onReplace}>{t(messages.replace)}</Button>
  </section>}</>
}
