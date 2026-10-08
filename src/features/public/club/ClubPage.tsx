import { Info, MapPin, Phone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import type { Message } from '@/i18n/types'
import { clubContent } from './club-content'
import { clubMessages } from './club.messages'

const facts: { label: Message; value: Message | null; Icon: LucideIcon }[] = [
  { label: clubMessages.description, value: clubContent.description, Icon: Info },
  { label: clubMessages.contact, value: clubContent.contact, Icon: Phone },
  { label: clubMessages.address, value: clubContent.address, Icon: MapPin },
]

// The app bar already carries the club's name, so this screen names the page once and lists its facts.
export function ClubPage() {
  const { t } = useI18n()
  const [logoFailed, setLogoFailed] = useState(false)
  return (
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-5 py-6">
      {clubContent.logoSrc !== null && !logoFailed && (
        <img src={clubContent.logoSrc} alt={clubContent.name} className="size-20 rounded-md object-contain" onError={() => setLogoFailed(true)} />
      )}
      <h1 className="text-headline font-bold text-on-surface">{t(clubMessages.heading)}</h1>

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
    </div>
  )
}
