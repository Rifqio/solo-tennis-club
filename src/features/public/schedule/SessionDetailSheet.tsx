import type { RefObject } from 'react'
import { Sheet } from '@/components/ui/sheet'
import { useI18n } from '@/i18n/use-i18n'
import type { PublicSessionSummary } from '@shared/api/public'
import { detailMessages as messages } from './detail.messages'
import { useSessionDetailContent } from './session-detail-content'
import type { SessionPlayers } from './use-session-players'

interface SessionDetailSheetProps {
  id: string | null
  seed?: PublicSessionSummary | null
  knownPlayers?: { date: string; state: SessionPlayers }
  onClose: () => void
  returnFocus: RefObject<HTMLElement | null>
}

// Phones and tablets: the session detail rises as a bottom sheet over the schedule.
export function SessionDetailSheet({ id, seed = null, knownPlayers, onClose, returnFocus }: SessionDetailSheetProps) {
  const { t } = useI18n()
  const { title, band, body, footer, reset } = useSessionDetailContent({ id, seed, knownPlayers, onLeave: onClose })
  const close = () => { reset(); onClose() }
  return (
    <Sheet
      open={id !== null}
      onClose={close}
      title={title}
      description={t(messages.description)}
      closeLabel={t(messages.close)}
      returnFocus={returnFocus}
      tone="court"
      band={band}
      footer={footer}
    >
      {body}
    </Sheet>
  )
}
