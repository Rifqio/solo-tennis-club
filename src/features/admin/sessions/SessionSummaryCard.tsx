import type { ReactNode } from 'react'
import type { SessionOptions } from '@shared/api/admin-sessions'
import { clubDateTimeToInstant, clubTimeOf, isClubDate } from '@shared/club-time'
import { formatClubDateMedium, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { CoachAvatar } from '../forms/CoachAvatar'
import { adminMessages as messages } from '../forms/admin.messages'
import type { SessionDraft } from './session-draft'

const copy = {
  label: { id: 'Ringkasan sesi', en: 'Session summary' },
  newClass: { id: 'Kelas belum dipilih', en: 'No class chosen yet' },
  notSet: { id: 'Belum diisi', en: 'Not set yet' },
  perSlot: { id: '{price} / slot', en: '{price} / slot' },
  limits: { id: 'Min {min} · Max {max}', en: 'Min {min} · Max {max}' },
  price: { id: 'Harga', en: 'Price' },
}

// Desktop session editor (no board; follows the member booking flow's step card + summary, board D3): the session as
// it stands, filling in while the admin works through the steps, with the step's actions at its foot. Anything not
// chosen yet reads "Belum diisi" in muted text rather than looking like a value. `brief`: on the check step the card
// beside it is the full review, so this keeps only the heading and the actions instead of repeating every fact.
export function SessionSummaryCard({ draft, options, actions, brief = false }: { draft: SessionDraft; options: SessionOptions; actions: ReactNode; brief?: boolean }) {
  const { t, language } = useI18n()
  const named = (group: { id: string; name: string }[], id: string) => group.find(row => row.id === id)?.name ?? null
  const className = named(options.classes, draft.classId)
  const validTime = isClubDate(draft.date) && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime)
  const minutes = /^\d+$/.test(draft.durationMinutes) ? Number(draft.durationMinutes) : null
  const end = validTime && minutes && minutes <= 720 ? clubTimeOf(new Date(clubDateTimeToInstant(draft.date, draft.startTime).getTime() + minutes * 60000)) : null
  const price = /^\d+$/.test(draft.priceIdr) ? t(copy.perSlot, { price: formatIdr(Number(draft.priceIdr), language) }) : null
  const limits = draft.minParticipants && draft.maxParticipants ? t(copy.limits, { min: draft.minParticipants, max: draft.maxParticipants }) : null
  const coaches = draft.coachIds.map(id => options.coaches.find(row => row.id === id)).filter(coach => coach !== undefined)
  const fact = (label: string, value: ReactNode) => (
    <div className="flex items-start justify-between gap-4 border-t border-outline-variant py-3">
      <dt className="shrink-0 text-on-surface-variant">{label}</dt>
      <dd className={cn('min-w-0 text-right break-words', value ? 'font-semibold' : 'text-on-surface-variant')}>{value || t(copy.notSet)}</dd>
    </div>
  )
  return (
    <aside aria-label={t(copy.label)} className="sticky top-5 flex w-[22rem] shrink-0 flex-col overflow-hidden rounded-lg bg-surface-container-lowest xl:w-[24rem]">
      <div className="flex flex-col gap-1 bg-band-tile px-5 py-4 text-on-signboard">
        <h2 className="break-words text-title font-bold">{className ?? t(copy.newClass)}</h2>
        <p className="tabular-nums">
          {isClubDate(draft.date) ? formatClubDateMedium(draft.date, language) : t(copy.notSet)}
          {validTime && ` · ${draft.startTime}${end ? `-${end}` : ''} WIB`}
        </p>
      </div>
      {!brief && <dl className="flex flex-col px-5 pt-1">
        {fact(t(messages.level), named(options.levels, draft.levelId))}
        {fact(t(messages.venue), named(options.venues, draft.venueId))}
        {fact(t({ id: 'Coach', en: 'Coaches' }), coaches.length > 0 && (
          <span className="flex items-center justify-end gap-2">
            <span className="flex">{coaches.slice(0, 3).map(coach => <CoachAvatar key={coach.id} name={coach.name} photoUrl={'photoUrl' in coach ? coach.photoUrl : null} className="-ml-2 size-7 border-2 border-surface-container-lowest first:ml-0" />)}</span>
            <span>{coaches.map(coach => coach.name).join(', ')}</span>
          </span>
        ))}
        {fact(t(copy.price), price)}
        {fact(t({ id: 'Peserta', en: 'Players' }), limits)}
      </dl>}
      <div className={cn('mt-auto flex flex-col gap-2 px-5 pb-5', brief ? 'pt-5' : 'pt-3')}>{actions}</div>
    </aside>
  )
}
