import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import { StatusPanel } from '@/components/ui/status-panel'
import { adminMessages as messages } from './admin.messages'

// What went wrong with a save, inside the form (G1 notice panel). A version conflict is one panel, not an error and a
// second conflict box: what happened, the latest version beside the admin's input, and the way forward. Field
// problems are shown on the fields themselves, so they never also appear here.
export function FormFeedback({ failure, latest, onReplace, yours }: { failure: string | null; latest?: ReactNode; yours?: ReactNode; onReplace?: () => void }) {
  const { t } = useI18n()
  if (latest) {
    return (
      <StatusPanel tone="error" title={t(messages.conflictTitle)} action={onReplace && { label: t(messages.replace), onAction: onReplace }}>
        <p>{t(messages.conflict)}</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div className="min-w-0 break-words"><h2 className="font-bold">{t(messages.latest)}</h2>{latest}</div>
          <div className="min-w-0 break-words"><h2 className="font-bold">{t(messages.yours)}</h2>{yours}</div>
        </div>
      </StatusPanel>
    )
  }
  return failure ? <StatusPanel tone="error" title={failure} /> : null
}
