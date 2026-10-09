import { Info, MapPin, Phone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { CourtBand } from '../layout/CourtBand'
import type { Message } from '@/i18n/types'
import { clubContent } from './club-content'
import { clubMessages } from './club.messages'

const facts: { label: Message; value: Message | null; Icon: LucideIcon }[] = [
  { label: clubMessages.description, value: clubContent.description, Icon: Info },
  { label: clubMessages.contact, value: clubContent.contact, Icon: Phone },
  { label: clubMessages.address, value: clubContent.address, Icon: MapPin },
]

// The band carries the club's mark and names the page; below it the club's facts.
export function ClubPage() {
  const { t } = useI18n()
  const [logoFailed, setLogoFailed] = useState(false)
  return (
    <>
    <CourtBand title={t(clubMessages.heading)} />
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-5 py-6">
      {clubContent.logoSrc !== null && !logoFailed && (
        <img src={clubContent.logoSrc} alt={clubContent.name} className="size-20 rounded-md object-contain" onError={() => setLogoFailed(true)} />
      )}

      {/* Material list on the lowest container: leading icon, label, supporting text. Read-only until the club supplies content. */}
      <dl className="flex flex-col divide-y divide-outline-variant overflow-hidden rounded-md bg-surface-container-lowest">
        {facts.map(({ label, value, Icon }) => (
          <div key={label.en} className="flex items-start gap-4 px-4 py-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <dt className="text-label font-bold text-on-surface-variant">{t(label)}</dt>
              <dd className="max-w-[65ch] break-words text-on-surface">
                {value === null ? <span className="text-on-surface-variant">{t(commonMessages.unavailable)}</span> : t(value)}
              </dd>
            </div>
          </div>
        ))}
      </dl>
      <Link to="/admin/sign-in" className="inline-flex min-h-12 items-center self-start rounded-sm px-3 text-label text-on-surface-variant underline underline-offset-4">{t({ id: 'Masuk admin', en: 'Admin sign in' })}</Link>
    </div>
    </>
  )
}
