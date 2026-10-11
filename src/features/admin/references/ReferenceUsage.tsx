import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { ReferenceUsage as Usage } from '@shared/api/admin-references'
import { clubDateOf } from '@shared/club-time'
import { formatClubDateShort, formatClubTime } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { adminMessages as messages } from '../forms/admin.messages'

const copy = {
  usedIn: { id: 'Dipakai di {count} kelas', en: 'Used in {count} classes' },
  renameNote: { id: 'Ganti nama di sini, semua kelas ikut berubah.', en: 'Rename it here and every class follows.' },
  unused: { id: 'Belum dipakai di kelas mana pun. Pilih dari halaman Kelas.', en: 'Not used by any class yet. Pick it on the Classes page.' },
  next: { id: 'Sesi berikutnya', en: 'Next session' },
  noNext: { id: 'Belum ada', en: 'None yet' },
  minutes: { id: '{count} mnt', en: '{count} min' },
}

// Where a coach or level is used: each class with its next scheduled session, and a jump to edit that class.
export function ReferenceUsage({ usage }: { usage: Usage | null }) {
  const { t, language } = useI18n()
  if (!usage) return <p role="status" className="sr-only">{t(messages.loading)}</p>
  if (usage.classes.length === 0) return <p className="rounded-sm bg-surface-container-low px-3.5 py-3 text-label text-on-surface-variant">{t(copy.unused)}</p>
  return (
    <section aria-labelledby="usage-title" className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="usage-title" className="font-bold">{t(copy.usedIn, { count: usage.classes.length })}</h3>
        <span className="text-label text-on-surface-variant">{t(copy.renameNote)}</span>
      </div>
      <ul className="border-t border-outline-variant">
        {usage.classes.map(row => {
          const day = row.nextSessionAt ? clubDateOf(row.nextSessionAt) : null
          return (
            <li key={row.id} className="border-b border-outline-variant">
              <Link to={`/admin/classes/${row.id}/edit`} viewTransition className="state-layer pressable grid min-h-16 grid-cols-[minmax(0,1fr)_auto_1.125rem] items-center gap-3 px-1 py-2.5">
                <span className="flex min-w-0 flex-col leading-snug">
                  <span title={row.name} className="truncate font-bold">{row.name}</span>
                  <span className="text-label text-on-surface-variant">{row.levelName} · {row.venueName} · {t(copy.minutes, { count: row.durationMinutes })}</span>
                </span>
                <span className="flex flex-col items-end leading-snug">
                  <span className="text-label text-on-surface-variant">{t(copy.next)}</span>
                  <span className="text-label font-semibold tabular-nums">
                    {day && row.nextSessionAt ? `${formatClubDateShort(day, language)}, ${formatClubTime(row.nextSessionAt)}` : t(copy.noNext)}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" className="size-[1.125rem] text-on-surface-variant" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
