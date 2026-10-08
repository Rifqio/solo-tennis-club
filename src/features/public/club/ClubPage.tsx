import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { clubContent } from './club-content'
import { clubMessages } from './club.messages'

const facts = [
  { label: clubMessages.description, value: clubContent.description },
  { label: clubMessages.contact, value: clubContent.contact },
  { label: clubMessages.address, value: clubContent.address },
]

export function ClubPage() {
  const { t } = useI18n()
  const [logoFailed, setLogoFailed] = useState(false)
  const nothingSupplied = facts.every(fact => fact.value === null)
  return (
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-6 py-6 lg:py-8">
      <h1 className="text-heading font-bold lg:text-display">{t(clubMessages.heading)}</h1>

      <section className="flex flex-col gap-4">
        {clubContent.logoSrc !== null && !logoFailed && (
          <img src={clubContent.logoSrc} alt={clubContent.name} className="h-auto max-h-24 w-auto max-w-full" onError={() => setLogoFailed(true)} />
        )}
        <p className="text-heading font-bold break-words">{clubContent.name}</p>
        {nothingSupplied && <StatusPanel tone="info" title={t(clubMessages.notAvailableYet)} />}
        <dl className="flex flex-col divide-y divide-border">
          {facts.map(fact => (
            <div key={fact.label.en} className="flex flex-col gap-1 py-4 first:pt-0">
              <dt className="text-label font-bold text-muted-foreground">{t(fact.label)}</dt>
              <dd className="max-w-[65ch] break-words">
                {fact.value === null ? <span className="text-muted-foreground">{t(commonMessages.unavailable)}</span> : t(fact.value)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <Button asChild variant="secondary" className="self-start">
        <Link to="/">{t(clubMessages.backToSchedule)}</Link>
      </Button>
    </div>
  )
}
