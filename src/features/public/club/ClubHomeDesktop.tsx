import { ArrowRight, ExternalLink, MapPin, MessageCircle, Wallet } from 'lucide-react'
import { LatestPhotos } from '@/features/photos/AlbumCard'
import { Link } from 'react-router-dom'
import { ClubCrest } from '@/components/brand/club-crest'
import { CourtLines } from '@/components/brand/court-lines'
import { LanguageMenu } from '@/components/ui/language-switch'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import type { ApiResult } from '@/lib/api'
import { cn } from '@/lib/utils'
import { venueMapsHref } from '@shared/maps'
import type { PublicSessionSummary, PublicVenuesResponse } from '@shared/api/public'
import { useUpcoming } from '../layout/use-upcoming'
import { SampleDataNotice } from '../schedule/SampleDataNotice'
import { detailMessages } from '../schedule/detail.messages'
import { scheduleMessages } from '../schedule/schedule.messages'
import { clubContent } from './club-content'
import { clubHomeMessages as messages } from './club-home.messages'
import { clubMessages } from './club.messages'

// The board's stock photos, copied from the design canvas (public/photos/club-*.json) until the club sends its own.
const PHOTOS = {
  hero: '/photos/club-hero.webp', schedule: '/photos/club-schedule.webp', group: '/photos/club-group.webp',
  pay: '/photos/club-pay.webp', payStep: '/photos/club-pay-step.webp', courts: '/photos/club-courts.webp',
}
const STEP_PHOTOS = [PHOTOS.schedule, PHOTOS.group, PHOTOS.payStep, PHOTOS.hero]

const wrap = 'mx-auto w-full max-w-[85rem] px-[clamp(1rem,3vw,2.5rem)]'
const statement = 'text-statement font-bold uppercase tracking-[-0.02em]'

// The club's name across two poster lines: everything but the last two words, then the last two ("Tennis Club").
function heroLines(name: string) {
  const words = name.split(' ')
  return words.length > 2 ? [words.slice(0, -2).join(' '), words.slice(-2).join(' ')] : [name]
}

interface ClubHomeDesktopProps {
  venues: { result: ApiResult<PublicVenuesResponse> | null; retry: () => void }
}

// Desktop home page (board D1): the club's front page with its own top nav, a poster hero, what the app does, how to
// book, the nearest sessions, the courts and a closing band. Phones and tablets keep the compact club screen.
export function ClubHomeDesktop({ venues }: ClubHomeDesktopProps) {
  const { t } = useI18n()
  const whatsappHref = clubContent.whatsapp ? `https://wa.me/${clubContent.whatsapp}` : null
  return (
    <div className="bg-surface text-on-surface">
      <header className={cn(wrap, 'club-in grid min-h-20 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6')}>
        <Link to="/" aria-label={t(messages.homeLabel, { club: clubContent.name })} className="flex min-h-12 items-center gap-2.5 justify-self-start text-primary">
          <ClubCrest className="h-10 w-8 text-band" detailClassName="fill-white" ballRim />
          <span className="text-title font-bold uppercase tracking-[0.16em] text-on-surface">{clubContent.name}</span>
        </Link>
        <nav aria-label={t(messages.pagesNav)} className="flex items-center gap-1">
          <Link to="/schedule" viewTransition data-nav="tab" className="state-layer flex min-h-12 items-center whitespace-nowrap rounded-full px-3 font-medium xl:px-4">{t(messages.navSchedule)}</Link>
          <a href="#steps" className="state-layer flex min-h-12 items-center whitespace-nowrap rounded-full px-3 font-medium xl:px-4">{t(messages.navSteps)}</a>
          <a href="#courts" className="state-layer flex min-h-12 items-center whitespace-nowrap rounded-full px-3 font-medium xl:px-4">{t(messages.navCourts)}</a>
          <a href="#contact" className="state-layer flex min-h-12 items-center whitespace-nowrap rounded-full px-3 font-medium xl:px-4">{t(messages.navContact)}</a>
        </nav>
        <div className="flex items-center gap-2 justify-self-end">
          <LanguageMenu className="text-on-surface" />
          <Link to="/account" viewTransition data-nav="push" className="state-layer flex min-h-12 items-center whitespace-nowrap rounded-full px-3 font-semibold xl:px-4">{t(messages.account)}</Link>
          <Link to="/schedule" viewTransition data-nav="tab" className="state-layer pressable flex min-h-12 items-center whitespace-nowrap rounded-full bg-cta px-5 font-semibold text-on-cta xl:px-6">{t(messages.seeSchedule)}</Link>
        </div>
      </header>

      <Hero whatsappHref={whatsappHref} />

      <section id="about" aria-labelledby="about-title" className="mx-auto flex max-w-[65rem] flex-wrap justify-center gap-x-14 gap-y-4 px-[clamp(1rem,3vw,2.5rem)] pb-14 pt-[clamp(4.5rem,9vw,8rem)]">
        <p className="club-reveal mt-2.5 flex-[0_1_11rem] text-label font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{t(messages.aboutKicker)}</p>
        <div className="club-reveal flex max-w-[45rem] flex-[1_1_35rem] flex-col gap-5">
          <h2 id="about-title" className={statement}>{t(messages.aboutStatement)} <span className="text-primary">{t(messages.aboutStatementAccent)}</span></h2>
          <p className="max-w-[40rem] text-title font-normal text-on-surface-variant">{clubContent.description ? t(clubContent.description) : t(clubMessages.aboutMissing)}</p>
        </div>
      </section>

      <section aria-label={t(messages.cardsLabel)} className={cn(wrap, 'grid grid-cols-3 gap-6 pb-[clamp(4.5rem,9vw,7.5rem)]')}>
        <FeatureCard to="/schedule" photo={PHOTOS.schedule} title={t(messages.cardSchedule)} text={t(messages.cardScheduleText)} go={t(messages.cardScheduleGo)} />
        <FeatureCard to="/schedule" photo={PHOTOS.group} title={t(messages.cardGroup)} text={t(messages.cardGroupText)} go={t(messages.cardGroupGo)} />
        <FeatureCard href="#steps" photo={PHOTOS.pay} title={t(messages.cardPay)} text={t(messages.cardPayText)} go={t(messages.cardPayGo)} />
      </section>

      <Steps />
      <NextSessions />
      <div className={cn(wrap, 'pt-[clamp(4.5rem,9vw,7.5rem)]')}><LatestPhotos desktop /></div>
      <Courts venues={venues} />

      <footer id="contact" className={cn(wrap, 'pb-[clamp(1rem,3vw,2.5rem)]')}>
        <div className="relative isolate flex flex-col gap-12 overflow-hidden rounded-lg bg-band px-[clamp(1.5rem,5vw,4.5rem)] pt-[clamp(3rem,6vw,5.5rem)] text-on-signboard">
          <CourtLines className="pointer-events-none absolute -right-10 -top-10 -z-10 h-[28rem] text-on-signboard/15" />
          <div className="club-reveal flex flex-wrap items-end justify-between gap-6">
            <h2 className={cn(statement, 'max-w-[14ch]')}>{t(messages.closing)}</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/schedule" viewTransition data-nav="tab" className="state-layer pressable flex min-h-14 items-center rounded-full bg-cta px-7 text-title font-semibold text-on-cta">{t(messages.seeSchedule)}</Link>
              {whatsappHref && <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="state-layer pressable flex min-h-14 items-center rounded-full bg-surface-container-lowest px-7 text-title font-semibold text-primary">{t(messages.chatAdmin)}</a>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 rounded-md bg-band-tile p-6">
            <dl className="flex flex-col gap-1">
              <dt className="text-label">{t(clubMessages.whatsapp)}</dt>
              <dd className="font-bold">{whatsappHref ? <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="text-on-signboard underline underline-offset-4">+{clubContent.whatsapp}</a> : t(commonMessages.unavailable)}</dd>
            </dl>
            <dl className="flex flex-col gap-1">
              <dt className="text-label">{t(clubMessages.instagram)}</dt>
              <dd className="font-bold">{clubContent.instagram ? <a href={`https://instagram.com/${clubContent.instagram}`} target="_blank" rel="noopener noreferrer" className="text-on-signboard underline underline-offset-4">@{clubContent.instagram}</a> : t(commonMessages.unavailable)}</dd>
            </dl>
            <nav aria-label={t(messages.moreNav)} className="flex flex-col items-start">
              <Link to="/bookings" viewTransition data-nav="tab" className="flex min-h-12 items-center font-semibold text-on-signboard underline-offset-4 hover:underline">{t(messages.myBookings)}</Link>
              <Link to="/admin/sign-in" className="flex min-h-12 items-center font-semibold text-on-signboard underline-offset-4 hover:underline">{t(clubMessages.adminSignIn)}</Link>
            </nav>
          </div>
          <p aria-hidden="true" className="club-wordmark -mb-[0.16em] text-center font-bold uppercase whitespace-nowrap">{clubContent.shortName}</p>
        </div>
        <p className="mt-4 text-center text-label text-on-surface-variant">© {new Date().getFullYear()} {clubContent.name} · {clubContent.city}</p>
      </footer>
    </div>
  )
}

function Hero({ whatsappHref }: { whatsappHref: string | null }) {
  const { t } = useI18n()
  const lines = heroLines(clubContent.name)
  return (
    <section aria-labelledby="hero-title" className={wrap}>
      <div className="relative isolate flex min-h-[clamp(35rem,78vh,47.5rem)] flex-col overflow-hidden rounded-lg bg-band text-on-signboard">
        <img src={PHOTOS.hero} alt="" decoding="async" fetchPriority="high" className="club-photo absolute inset-0 -z-10 size-full object-cover object-[50%_40%]" />
        <div aria-hidden="true" className="photo-tint-court absolute inset-0 -z-10" />
        {/* Court lines over the photo: the baselines and the centre and side lines, faint. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-22 h-px bg-on-signboard/20" />
          <div className="absolute inset-x-0 bottom-28 h-px bg-on-signboard/20" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-on-signboard/15" />
          <div className="absolute inset-y-0 left-[clamp(1.5rem,4vw,3.5rem)] w-px bg-on-signboard/15" />
          <div className="absolute inset-y-0 right-[clamp(1.5rem,4vw,3.5rem)] w-px bg-on-signboard/15" />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-12 pt-30 text-center">
          <p className="club-in rounded-full bg-accent px-3.5 py-1.5 text-label font-semibold text-on-accent [animation-delay:200ms]">{t(messages.kicker, { city: clubContent.city })}</p>
          <h1 id="hero-title" tabIndex={-1} className="text-poster font-bold uppercase tracking-[-0.02em] focus:outline-none">
            {lines.map((line, index) => (
              <span key={line} className="club-mask"><span style={{ animationDelay: `${250 + index * 130}ms` }}>{line}</span></span>
            ))}
          </h1>
          <p className="club-in max-w-[34rem] text-title font-normal [animation-delay:650ms]">{t(messages.heroLine)}</p>
          <div className="club-in flex flex-wrap justify-center gap-3 [animation-delay:780ms]">
            <Link to="/schedule" viewTransition data-nav="tab" className="state-layer pressable flex min-h-14 items-center gap-4 rounded-full bg-cta py-2 pl-7 pr-2 text-title font-semibold text-on-cta">
              {t(messages.seeSchedule)}
              <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-surface-container-lowest"><ArrowRight className="size-5" strokeWidth={2.25} /></span>
            </Link>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="state-layer pressable flex min-h-14 items-center gap-2.5 rounded-full border-[1.5px] border-on-signboard px-7 text-title font-semibold">
                <MessageCircle aria-hidden="true" className="size-5" />{t(messages.chatAdmin)}
              </a>
            )}
          </div>
        </div>
        <div className="club-in flex h-28 items-center justify-between gap-6 px-[clamp(2.5rem,6vw,5.5rem)] [animation-delay:900ms]">
          <p className="flex items-center gap-3.5 font-bold uppercase leading-tight">
            <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-on-signboard"><MapPin className="size-5" /></span>
            {clubContent.city}
          </p>
          <a href="#about" aria-label={t(messages.scrollLabel)} className="flex min-h-12 items-center gap-2.5 text-label font-semibold uppercase tracking-[0.24em] text-on-signboard">
            <span aria-hidden="true" className="box-border flex h-12 w-8 justify-center rounded-full border-[1.5px] border-on-signboard pt-2.5"><span className="h-2 w-[3px] rounded-xs bg-accent" /></span>
            {t(messages.scroll)}
          </a>
          <p className="flex max-w-[12rem] items-center gap-3.5 text-right font-bold uppercase leading-tight">
            {t(messages.payWays)}
            <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-on-signboard"><Wallet className="size-5" /></span>
          </p>
        </div>
      </div>
    </section>
  )
}

type CardTarget = { to: string; href?: never } | { href: string; to?: never }

function FeatureCard({ photo, title, text, go, ...target }: CardTarget & { photo: string; title: string; text: string; go: string }) {
  const className = 'club-reveal group flex flex-col overflow-hidden rounded-lg bg-surface-container-lowest transition-transform duration-300 hover:-translate-y-1'
  const body = <>
    <span className="block h-64 overflow-hidden"><img src={photo} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /></span>
    <span className="flex flex-col gap-2 p-6">
      <span className="text-headline font-bold">{title}</span>
      <span className="text-on-surface-variant">{text}</span>
      <span className="mt-2 inline-flex items-center gap-1.5 font-semibold text-primary">{go}<ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.25} /></span>
    </span>
  </>
  return target.to ? <Link to={target.to} className={className}>{body}</Link> : <a href={target.href} className={className}>{body}</a>
}

function Steps() {
  const { t } = useI18n()
  return (
    <section id="steps" aria-labelledby="steps-title" className="bg-surface-container-lowest py-[clamp(4.5rem,9vw,7.5rem)]">
      <div className={cn(wrap, 'flex flex-col gap-10')}>
        <div className="club-reveal flex flex-wrap items-end justify-between gap-4">
          <h2 id="steps-title" className={statement}>{t(messages.stepsTitle)}</h2>
          <p className="max-w-[26rem] text-on-surface-variant">{t(messages.stepsIntro)}</p>
        </div>
        <ol className="border-t border-outline-variant">
          {messages.steps.map((step, index) => (
            <li key={index} className="club-reveal border-b border-outline-variant">
              {/* Hover or focus fills the row Deep Court and slides a photo in beside the go label. */}
              <Link to="/schedule" viewTransition data-nav="tab" className="group relative grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-6 rounded-sm px-6 py-7 transition-colors duration-300 hover:bg-primary hover:text-on-primary focus-visible:bg-primary focus-visible:text-on-primary">
                <span className="text-label font-semibold tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                <span className="flex flex-col gap-1 pr-56">
                  <span className="text-display font-bold">{t(step.title)}</span>
                  <span className="text-on-surface-variant transition-colors duration-300 group-hover:text-on-primary group-focus-visible:text-on-primary">{t(step.text)}</span>
                </span>
                <span className="flex -translate-x-2 items-center gap-1.5 font-semibold opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                  {t(step.go)}<ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.25} />
                </span>
                <img src={STEP_PHOTOS[index]} alt="" loading="lazy"
                  className="pointer-events-none absolute right-50 top-1/2 h-28 w-40 translate-x-6 -translate-y-1/2 rotate-6 rounded-sm object-cover opacity-0 transition duration-500 group-hover:translate-x-0 group-hover:-rotate-4 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:-rotate-4 group-focus-visible:opacity-100" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function sessionStatus(session: PublicSessionSummary, t: ReturnType<typeof useI18n>['t']) {
  return session.availability === 'available' || session.availability === 'nearly_full'
    ? t(detailMessages.slotsLeft, { count: session.remainingPlaces }) : t(scheduleMessages.status[session.availability])
}

function NextSessions() {
  const { language, t } = useI18n()
  const upcoming = useUpcoming(true)
  const sessions = upcoming.status === 'ready' ? upcoming.data.sessions.slice(0, 3) : []
  return (
    <section aria-labelledby="next-title" className={cn(wrap, 'flex flex-col gap-8 pt-[clamp(4.5rem,9vw,7.5rem)]')}>
      <div className="club-reveal flex flex-wrap items-end justify-between gap-4">
        <h2 id="next-title" className={statement}>{t(messages.nextTitle)}</h2>
        <Link to="/schedule" viewTransition data-nav="tab" className="flex min-h-12 items-center gap-1.5 font-semibold text-primary">{t(messages.allSchedule)}<ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.25} /></Link>
      </div>
      {upcoming.status === 'loading' ? (
        <ul aria-hidden="true" className="skeleton-in grid grid-cols-3 gap-6">{[0, 1, 2].map(key => (
          <li key={key} className="flex h-40 flex-col gap-3 rounded-lg bg-surface-container-lowest p-5">
            <span className="flex gap-0.5"><span className="skeleton size-12 rounded-xs" /><span className="skeleton ml-2 size-12 rounded-xs" /></span>
            <span className="skeleton h-5 w-3/4 rounded-xs" /><span className="skeleton h-3.5 w-1/2 rounded-xs" />
          </li>
        ))}</ul>
      ) : upcoming.status === 'error' ? (
        <StatusPanel tone="error" title={t(messages.nextError)} action={{ label: t(commonMessages.retry), onAction: upcoming.retry }} />
      ) : sessions.length === 0 ? (
        <p className="rounded-lg bg-surface-container-lowest p-8 text-on-surface-variant">{t(messages.nextEmpty)}</p>
      ) : <>
        {sessions.some(session => session.isSample) && <SampleDataNotice />}
        <ul className="grid grid-cols-3 gap-6">
          {sessions.map(session => {
            const closed = session.availability === 'full' || session.availability === 'cancelled'
            return (
              <li key={session.id} className="club-reveal">
                <Link to={`/schedule?${new URLSearchParams({ date: session.date, session: session.id })}`} viewTransition data-nav="tab"
                  className="flex flex-col gap-5 rounded-lg bg-surface-container-lowest p-6 transition-transform duration-300 hover:-translate-y-1">
                  <span className="flex items-center justify-between gap-3 text-label font-semibold">
                    <span className="text-on-surface-variant">{formatClubDateShort(session.date, language)}</span>
                    <span className={closed ? 'text-on-surface-variant' : 'text-primary'}>{sessionStatus(session, t)}</span>
                  </span>
                  <span className="flex items-center gap-4">
                    <span className={cn('rounded-xs px-3 py-2 text-numeral font-bold tabular-nums', closed ? 'bg-surface-container-high text-on-surface-variant' : 'bg-band-tile text-on-signboard')}>{session.startTime}</span>
                    <span className="flex min-w-0 flex-col leading-snug">
                      <span className="break-words text-title font-bold">{session.className}</span>
                      <span className="text-label text-on-surface-variant">{session.levelName} · {session.venueName}</span>
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </>}
    </section>
  )
}

function Courts({ venues }: ClubHomeDesktopProps) {
  const { t } = useI18n()
  const { result, retry } = venues
  const list = result?.kind === 'ok' ? result.data.venues : []
  return (
    <section id="courts" aria-labelledby="courts-title" className={cn(wrap, 'flex flex-wrap gap-10 py-[clamp(4.5rem,9vw,7.5rem)]')}>
      <div className="club-reveal relative min-h-[22.5rem] flex-[1_1_22.5rem] overflow-hidden rounded-lg bg-band">
        <img src={PHOTOS.courts} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      </div>
      <div className="club-reveal flex flex-[1_1_26rem] flex-col justify-center gap-6">
        <h2 id="courts-title" className={statement}>{t(clubMessages.courts)}</h2>
        <p className="text-on-surface-variant">{t(messages.courtsIntro)}</p>
        {!result ? (
          <div aria-hidden="true" className="flex flex-col gap-2">{[0, 1].map(key => <div key={key} className="h-18 rounded-sm bg-surface-container" />)}</div>
        ) : result.kind !== 'ok' ? (
          <StatusPanel tone="error" title={t(clubMessages.courtsError)} action={{ label: t(commonMessages.retry), onAction: retry }} />
        ) : list.length === 0 ? (
          <p className="text-on-surface-variant">{t(clubMessages.courtsEmpty)}</p>
        ) : <>
          {list.some(venue => venue.isSample) && <SampleDataNotice />}
          <ul className="border-t border-outline-variant">
            {list.map(venue => (
              <li key={venue.id} className="border-b border-outline-variant">
                <a href={venueMapsHref(venue.name, venue.mapUrl, venue.address)} target="_blank" rel="noopener noreferrer" aria-label={t(clubMessages.openMapsLabel, { venue: venue.name })}
                  className="state-layer flex min-h-18 items-center justify-between gap-4 rounded-xs">
                  <span className="flex min-w-0 flex-col">
                    <span className="break-words text-title font-semibold">{venue.name}</span>
                    {venue.address && <span className="break-words text-label text-on-surface-variant">{venue.address}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-label font-semibold text-primary">{t(clubMessages.openMaps)}<ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={2.25} /></span>
                </a>
              </li>
            ))}
          </ul>
        </>}
      </div>
    </section>
  )
}
