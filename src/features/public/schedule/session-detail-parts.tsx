import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { PublicSessionSummary } from '@shared/api/public'
import { detailMessages as messages } from './detail.messages'
import { useSessionPlayers } from './use-session-players'
import type { SessionPlayers } from './use-session-players'

// Small pieces of the session detail, shared by the phone sheet and the desktop panel.
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-t border-outline-variant py-3 first:border-t-0">
      <dt className="shrink-0 text-label text-on-surface-variant">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold">{children}</dd>
    </div>
  )
}

// Who is playing: names for signed-in members (P2-10); visitors get the count and a sign-in link back to this sheet.
export function Players({ session, known }: { session: PublicSessionSummary; known?: SessionPlayers }) {
  const { t } = useI18n()
  const reuse = known !== undefined && known.status !== 'loading'
  const fetched = useSessionPlayers(reuse ? null : session.date)
  const players = reuse ? known : fetched
  if (players.status === 'unavailable') return null
  // Holds the card's height while names load, so the facts below never jump.
  if (players.status === 'loading') return <div aria-hidden="true" className="appear-late h-12 rounded-sm bg-surface-container" />
  if (players.status === 'signedOut') {
    const returnTo = `/schedule?${new URLSearchParams({ date: session.date, session: session.id })}`
    return (
      <Link to={`/customer/sign-in?returnTo=${encodeURIComponent(returnTo)}`} viewTransition data-nav="push" className="state-layer pressable flex min-h-12 items-center rounded-sm bg-surface px-3 text-label font-semibold text-primary">
        {t(messages.signInToSee)}
      </Link>
    )
  }
  const names = players.sessions[session.id] ?? []
  return <PlayerList names={names} />
}

const PREVIEW_NAMES = 3

// Who is playing as a tappable card: the first names, a "+N" chip, and "Lihat semua" to open the whole list in place.
function PlayerList({ names }: { names: string[] }) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const title = t(messages.players, { count: names.length })
  const chip = 'max-w-full break-words rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 text-label'
  if (names.length === 0) {
    return (
      <section className="flex flex-col gap-1 rounded-sm bg-primary-container p-3 text-on-primary-container">
        <h3 className="text-label font-semibold">{title}</h3>
        <p className="text-label">{t(messages.playersEmpty)}</p>
      </section>
    )
  }
  const expandable = names.length > PREVIEW_NAMES
  const shown = expanded || !expandable ? names : names.slice(0, PREVIEW_NAMES)
  const list = (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((name, index) => <li key={index} className={chip}>{name}</li>)}
      {!expanded && expandable && <li className="rounded-full bg-primary px-3 py-1 text-label font-semibold text-on-primary">+{names.length - PREVIEW_NAMES}</li>}
    </ul>
  )
  if (!expandable) {
    return (
      <section className="flex flex-col gap-2 rounded-sm border border-primary/25 bg-primary-container p-3 text-on-primary-container">
        <h3 className="text-label font-semibold">{title}</h3>
        {list}
      </section>
    )
  }
  return (
    <section className="flex flex-col gap-2 rounded-sm border border-primary/25 bg-primary-container p-3 text-on-primary-container">
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}
        aria-label={expanded ? undefined : t(messages.seeAllLabel, { count: names.length })}
        className="state-layer pressable -m-1 flex min-h-12 items-center justify-between gap-2 rounded-xs p-1 text-left">
        <span className="text-label font-semibold">{title}</span>
        <span className="flex items-center gap-0.5 text-label font-semibold text-primary">
          {expanded ? t(messages.showLess) : t(messages.seeAll)}
          <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform duration-200', expanded && 'rotate-180')} strokeWidth={2.5} />
        </span>
      </button>
      {list}
    </section>
  )
}

// A grey bar holding the space of text that is still loading, so rows keep their height.
export function Pending({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('appear-late inline-block h-4 rounded-xs bg-surface-container-high align-middle', className)} />
}

// Everything a session's detail shows, shared by the phone sheet and the desktop side panel: the title, the four fact
// tiles for the blue band, the body (state, players, facts) and the one action at the foot.
