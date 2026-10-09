import { useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import type { PublicSessionSummary } from '@shared/api/public'
import { SessionDetailSheet } from './SessionDetailSheet'
import type { SessionPlayers } from './use-session-players'

export interface DetailSheetHandle {
  open: (id: string, trigger: HTMLElement, seed?: PublicSessionSummary) => void
}

// Owns which session's detail is open. Keeping that state here, not in the schedule page, means opening the sheet
// re-renders only the sheet: the session cards (each with a layout animation) are not re-measured mid-slide.
export function DetailSheetHost({ ref, initialId, knownPlayers }: { ref: Ref<DetailSheetHandle>; initialId: string | null; knownPlayers?: { date: string; state: SessionPlayers } }) {
  const [opened, setOpened] = useState<{ id: string | null; seed: PublicSessionSummary | null }>({ id: initialId, seed: null })
  const trigger = useRef<HTMLElement | null>(null)
  useImperativeHandle(ref, () => ({
    open: (id, element, seed) => { trigger.current = element; setOpened({ id, seed: seed ?? null }) },
  }), [])
  return (
    <SessionDetailSheet
      id={opened.id}
      seed={opened.seed}
      knownPlayers={knownPlayers}
      onClose={() => setOpened({ id: null, seed: null })}
      returnFocus={trigger}
    />
  )
}
