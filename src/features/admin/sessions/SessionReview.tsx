import type { SessionDraft } from './session-draft'
import type { SessionOptions } from '@shared/api/admin-sessions'
import { clubDateTimeToInstant, clubDateOf, clubTimeOf, isClubDate } from '@shared/club-time'
import { formatClubDateLong, formatIdr } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { commonMessages } from '@/i18n/common.messages'
import { adminMessages as messages } from '../forms/admin.messages'
export function SessionReview({ draft, options }: { draft: SessionDraft; options: SessionOptions }) {
  const { t, language } = useI18n()
  const unavailable = t(commonMessages.unavailable)
  const named = (group: { id: string; name: string }[], id: string) => group.find(row => row.id === id)?.name ?? unavailable
  const validTime = isClubDate(draft.date) && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime)
  const end = validTime && /^\d+$/.test(draft.durationMinutes) && Number(draft.durationMinutes) <= 720 ? new Date(clubDateTimeToInstant(draft.date, draft.startTime).getTime() + Number(draft.durationMinutes) * 60000) : null
  const price = /^\d+$/.test(draft.priceIdr) && Number.isSafeInteger(Number(draft.priceIdr)) ? formatIdr(Number(draft.priceIdr), language) : draft.priceIdr || unavailable
  return <dl className="flex flex-col gap-4 break-words">
    {[
      [t(messages.classes), named(options.classes, draft.classId)],
      [t({ id: 'Tanggal dan waktu', en: 'Date and time' }), `${isClubDate(draft.date) ? formatClubDateLong(draft.date, language) : draft.date} ${draft.startTime} WIB`],
      [t({ id: 'Selesai', en: 'Ends' }), end ? `${formatClubDateLong(clubDateOf(end), language)} ${clubTimeOf(end)} WIB` : unavailable],
      [t(messages.duration), draft.durationMinutes], [t(messages.level), named(options.levels, draft.levelId)], [t(messages.venue), named(options.venues, draft.venueId)],
      [t(messages.price), price], [t(messages.min), draft.minParticipants], [t(messages.max), draft.maxParticipants],
    ].map(([label, value]) => <div key={label}><dt className="text-label text-on-surface-variant">{label}</dt><dd className="font-bold">{value || unavailable}</dd></div>)}
    <div><dt className="text-label text-on-surface-variant">{t({ id: 'Pelatih', en: 'Coaches' })}</dt><dd><ul className="flex flex-col gap-2">{draft.coachIds.length ? draft.coachIds.map(id => <li key={id}>{named(options.coaches, id)}</li>) : <li>{unavailable}</li>}</ul></dd></div>
  </dl>
}
