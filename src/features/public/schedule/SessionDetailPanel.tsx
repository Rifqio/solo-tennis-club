import { m, useReducedMotion } from 'motion/react'
import { useI18n } from '@/i18n/use-i18n'
import type { PublicSessionSummary } from '@shared/api/public'
import { detailMessages as messages } from './detail.messages'
import { useSessionDetailContent } from './session-detail-content'
import type { SessionPlayers } from './use-session-players'
import { panelEnter } from '@/lib/motion'

interface SessionDetailPanelProps {
  id: string
  seed?: PublicSessionSummary | null
  knownPlayers?: { date: string; state: SessionPlayers }
}

// Desktop: the chosen session sits beside the day's list instead of rising as a sheet, ready to book. Same content
// as the sheet. It slides in once when it first appears; choosing another session swaps the content in place.
export function SessionDetailPanel({ id, seed, knownPlayers }: SessionDetailPanelProps) {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const { title, band, body, footer } = useSessionDetailContent({ id, seed, knownPlayers, hideSampleNotice: true })
  return (
    <m.aside aria-label={t(messages.title)} {...panelEnter(reduceMotion)}
      className="sticky top-5 flex w-full flex-col overflow-hidden rounded-lg bg-surface-container-lowest">
      <div className="flex flex-col gap-4 bg-band p-6 text-on-signboard">
        <h2 className="break-words text-headline font-bold">{title}</h2>
        {band}
      </div>
      <div className="flex flex-col gap-4 px-6 pb-2 pt-5">{body}</div>
      {footer && <div className="border-t border-outline-variant px-6 py-5">{footer}</div>}
    </m.aside>
  )
}
