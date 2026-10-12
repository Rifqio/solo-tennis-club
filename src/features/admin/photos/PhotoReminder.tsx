import { Link } from 'react-router-dom'
import { ArrowRight, Camera, ChevronRight } from 'lucide-react'
import { formatClubDateShort } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { addClubDays } from '@shared/club-time'
import type { AlbumSession } from '@shared/api/session-photos'
import { adminPhotoMessages as messages } from './admin-photos.messages'

// Above the day's sessions (boards 10, D5): the newest session of the past week that ended without photos, one tap
// from its album, so the admin does not forget. It goes away by itself once the first photo is up.
export function PhotoReminder({ session, today, wide }: { session: AlbumSession; today: string; wide: boolean }) {
  const { language, t } = useI18n()
  const title = t(session.date === addClubDays(today, -1) ? messages.reminderTitle : messages.reminderTitleOlder)
  const facts = [formatClubDateShort(session.date, language), session.startTime, session.className].join(' · ')
  return (
    <Link to={`/admin/sessions/${session.id}/photos`} viewTransition data-nav="push"
      className="state-layer pressable flex flex-wrap items-center gap-3 rounded-sm border-2 border-accent bg-surface-container-lowest px-3.5 py-3 text-on-surface lg:gap-4 lg:rounded-[1rem] lg:px-5 lg:py-4">
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[0.625rem] bg-accent text-on-accent lg:size-12 lg:rounded-[0.75rem]"><Camera className="size-[1.375rem]" /></span>
      <span className="flex min-w-0 flex-[1_1_15rem] flex-col leading-snug">
        <span className="font-bold lg:text-title">{title}</span>
        <span className="text-label tabular-nums text-on-surface-variant lg:text-body">{facts}{wide && ` · ${t(messages.reminderNone)}`}</span>
      </span>
      {wide
        ? <span className="flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-[1.125rem] font-semibold text-on-primary">{t(messages.upload)}<ArrowRight aria-hidden="true" className="size-[1.125rem]" strokeWidth={2.25} /></span>
        : <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-on-surface-variant" />}
    </Link>
  )
}
