import { useEffect, useState } from 'react'
import { ArrowUpRight, ExternalLink, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Wordmark } from '@/components/brand/ball-mark'
import { LanguageMenu } from '@/components/ui/language-switch'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { getJson } from '@/lib/api'
import { useMediaQuery } from '@/lib/use-media-query'
import type { ApiResult } from '@/lib/api'
import { venueMapsHref } from '@shared/maps'
import type { PublicVenuesResponse } from '@shared/api/public'
import { SampleDataNotice } from '../schedule/SampleDataNotice'
import { LatestPhotos } from '@/features/photos/AlbumCard'
import { ClubHomeDesktop } from './ClubHomeDesktop'
import { clubContent } from './club-content'
import { clubMessages as messages } from './club.messages'

function useVenues() {
  const [result, setResult] = useState<ApiResult<PublicVenuesResponse> | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    void getJson<PublicVenuesResponse>('/api/public/venues', { signal: controller.signal }).then(response => {
      if (response.kind !== 'aborted') setResult(response)
    })
    return () => controller.abort()
  }, [attempt])
  return { result, retry: () => { setResult(null); setAttempt(value => value + 1) } }
}

// The club at a glance: a photo card with the schedule button in its cut corner, how to reach the admin, the club
// story, the courts sessions are played on (each opens Google Maps), and contacts.
export function ClubPage() {
  const { t } = useI18n()
  const { result, retry } = useVenues()
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  if (isDesktop) return <ClubHomeDesktop venues={{ result, retry }} />
  const venues = result?.kind === 'ok' ? result.data.venues : []
  const whatsappHref = clubContent.whatsapp ? `https://wa.me/${clubContent.whatsapp}` : null
  return (
    <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-5 pb-6 pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 items-center justify-between gap-3">
        <p aria-label={clubContent.name} className="text-primary"><Wordmark name={clubContent.shortName} seamClassName="stroke-on-signboard" /></p>
        <LanguageMenu className="-mr-3 text-on-surface" />
      </header>

      <section aria-labelledby="club-name" className="relative h-[21rem] sm:h-[24rem]">
        <div className="corner-notch absolute inset-0 overflow-hidden rounded-xl bg-ink">
          <img src={clubContent.photo} alt="" className="absolute inset-0 size-full object-cover" />
          <div aria-hidden="true" className="photo-scrim-bottom absolute inset-0" />
          <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-label font-semibold text-on-accent">{t(messages.kind)}</span>
          <div className="absolute bottom-5 left-5 right-24 text-white">
            <h1 id="club-name" tabIndex={-1} className="focus:outline-none text-headline font-bold leading-tight sm:text-display">{clubContent.name}</h1>
            <p className="mt-1">{clubContent.city}</p>
          </div>
        </div>
        <Link to="/schedule" viewTransition aria-label={t(messages.seeSchedule)}
          className="pressable absolute bottom-0 right-0 flex size-20 items-center justify-center rounded-full bg-accent text-on-accent outline-offset-4">
          <ArrowUpRight aria-hidden="true" className="size-8" strokeWidth={2.25} />
        </Link>
      </section>

      {whatsappHref && (
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
          className="pressable flex min-h-13 items-center justify-center gap-2 rounded-sm bg-band font-semibold text-on-signboard">
          <MessageCircle aria-hidden="true" className="size-5" />{t(messages.chatAdmin)}
        </a>
      )}

      <LatestPhotos />

      <section aria-labelledby="club-about" className="flex flex-col gap-1.5">
        <h2 id="club-about" className="text-title font-bold">{t(messages.about)}</h2>
        <p className="max-w-[65ch] text-on-surface-variant">{clubContent.description ? t(clubContent.description) : t(messages.aboutMissing)}</p>
      </section>

      <section aria-labelledby="club-courts" className="flex flex-col gap-2">
        <h2 id="club-courts" className="text-title font-bold">{t(messages.courts)}</h2>
        {!result ? (
          <div aria-hidden="true" className="flex flex-col gap-2">
            {[0, 1].map(key => <div key={key} aria-hidden="true" className="appear-late h-[4.5rem] rounded-sm bg-surface-container" />)}
          </div>
        ) : result.kind !== 'ok' ? (
          <StatusPanel tone="error" title={t(messages.courtsError)} action={{ label: t(commonMessages.retry), onAction: retry }} />
        ) : venues.length === 0 ? (
          <p className="text-on-surface-variant">{t(messages.courtsEmpty)}</p>
        ) : <>
          {venues.some(venue => venue.isSample) && <SampleDataNotice />}
          <ul className="flex flex-col gap-2">
            {venues.map(venue => (
              <li key={venue.id}>
                <a href={venueMapsHref(venue.name, venue.mapUrl, venue.address)} target="_blank" rel="noopener noreferrer"
                  aria-label={t(messages.openMapsLabel, { venue: venue.name })}
                  className="state-layer flex min-h-[4.5rem] items-center justify-between gap-3 rounded-sm bg-surface-container-lowest px-4 py-3">
                  <span className="flex min-w-0 flex-col">
                    <span className="break-words font-semibold">{venue.name}</span>
                    {venue.address && <span className="break-words text-label text-on-surface-variant">{venue.address}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-label font-semibold text-primary">
                    {t(messages.openMaps)}<ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </>}
      </section>

      <section aria-labelledby="club-contact" className="flex flex-col gap-2">
        <h2 id="club-contact" className="text-title font-bold">{t(messages.contact)}</h2>
        <dl className="flex flex-col divide-y divide-outline-variant rounded-sm bg-surface-container-lowest px-4">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-label text-on-surface-variant">{t(messages.whatsapp)}</dt>
            <dd className="text-right font-semibold">{whatsappHref
              ? <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="text-primary">+{clubContent.whatsapp}</a>
              : <span className="font-normal text-on-surface-variant">{t(commonMessages.unavailable)}</span>}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-label text-on-surface-variant">{t(messages.instagram)}</dt>
            <dd className="text-right font-semibold">{clubContent.instagram
              ? <a href={`https://instagram.com/${clubContent.instagram}`} target="_blank" rel="noopener noreferrer" className="text-primary">@{clubContent.instagram}</a>
              : <span className="font-normal text-on-surface-variant">{t(commonMessages.unavailable)}</span>}</dd>
          </div>
        </dl>
      </section>

      <Link to="/admin/sign-in" className="inline-flex min-h-12 items-center self-center rounded-sm px-3 text-label text-on-surface-variant underline underline-offset-4">{t(messages.adminSignIn)}</Link>
    </div>
  )
}
