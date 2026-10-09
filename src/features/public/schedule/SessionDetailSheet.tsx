import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { Link } from 'react-router-dom'
import { Sheet } from '@/components/ui/sheet'
import { StatusPanel } from '@/components/ui/status-panel'
import { Button } from '@/components/ui/button'
import { LanguageMenu } from '@/components/ui/language-switch'
import { useI18n } from '@/i18n/use-i18n'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateLong, formatClubTime, formatIdr, formatRemainingPlaces } from '@/i18n/format'
import type { PublicSessionDetail } from '@shared/api/public'
import { SampleDataNotice } from './SampleDataNotice'
import { detailMessages as messages } from './detail.messages'
import { scheduleMessages } from './schedule.messages'
import { AvailabilityMark } from '@/components/ui/availability-label'
import { clubDateOf } from '@shared/club-time'

export function SessionDetailSheet({ id, onClose, returnFocus }: {
  id: string | null; onClose: () => void; returnFocus: RefObject<HTMLElement | null>
}) {
  const { language, t } = useI18n()
  const [result, setResult] = useState<{ id: string; data?: PublicSessionDetail; missing?: boolean } | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    void fetch(`/api/public/sessions/${encodeURIComponent(id)}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) { if (!controller.signal.aborted) setResult({ id, missing: response.status === 404 }); return }
        const data = await response.json() as PublicSessionDetail
        if (!controller.signal.aborted) setResult({ id, data })
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ id }) })
    return () => controller.abort()
  }, [id, attempt])
  const data = result?.id === id ? result.data : null
  const valid = data && data.coaches && Number.isSafeInteger(data.priceIdr) && Number.isSafeInteger(data.maxParticipants)
    && Number.isSafeInteger(data.minParticipants) && Number.isSafeInteger(data.durationMinutes)
    && Number.isFinite(Date.parse(data.startsAt)) && Number.isFinite(Date.parse(data.endsAt))
  const open = data?.availability === 'available' || data?.availability === 'nearly_full'
  const tone = data?.availability === 'nearly_full' ? 'text-warning' : 'text-primary'
  return <Sheet open={id !== null} onClose={() => { setResult(null); onClose() }} title={data?.className || t(messages.title)} description={t(messages.description)} closeLabel={t(messages.close)} closeIcon returnFocus={returnFocus}>
    {!result || result.id !== id ? <p role="status">{t(messages.loading)}</p>
      : result.missing ? <StatusPanel tone="info" title={t(messages.missing)} />
      : !data ? <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: () => setAttempt(value => value + 1) }} />
      : !valid ? <StatusPanel tone="error" title={t(messages.incomplete)} action={{ label: t(commonMessages.retry), onAction: () => setAttempt(value => value + 1) }} />
      : <>
        {data.isSample && <SampleDataNotice />}
        <section className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-outline-variant pb-4">
          <p className="col-span-2 text-label font-bold uppercase tracking-wide text-primary">{formatClubDateLong(clubDateOf(data.startsAt), language)} · WIB</p>
          <p className="font-display text-numeral font-bold tabular-nums leading-none text-primary">{formatClubTime(data.startsAt)}<span className="px-2 text-title font-normal text-on-surface-variant">–</span>{formatClubTime(data.endsAt)}</p>
          <div className={`flex flex-col items-end gap-1 text-label font-bold ${tone}`}><span className="inline-flex items-center gap-1.5"><AvailabilityMark availability={data.availability} />{t(scheduleMessages.status[data.availability])}</span>
            {(data.availability === 'available' || data.availability === 'nearly_full') && <span className="text-on-surface-variant">{formatRemainingPlaces(data.remainingPlaces, language)}</span>}
          </div>
          <p className="col-span-2 text-title font-bold">{data.levelName}</p>
        </section>
        <dl className="grid grid-cols-1 divide-y divide-outline-variant sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
          <div className="py-3 sm:border-b sm:border-outline-variant"><dt className="text-label text-on-surface-variant">{t(messages.venue)}</dt><dd className="mt-1 font-bold">{data.venueName}</dd>{data.venueAddress && <dd className="text-label text-on-surface-variant">{data.venueAddress}</dd>}</div>
          <div className="py-3 sm:border-b sm:border-outline-variant"><dt className="text-label text-on-surface-variant">{t(messages.coaches)}</dt><dd className="mt-1 font-bold">{data.coaches.length ? data.coaches.join(', ') : t(commonMessages.unavailable)}</dd></div>
          <div className="py-3 sm:border-b sm:border-outline-variant"><dt className="text-label text-on-surface-variant">{t(messages.price)}</dt><dd className="mt-1 font-bold tabular-nums">{formatIdr(data.priceIdr, language)}</dd></div>
          <div className="py-3 sm:border-b sm:border-outline-variant"><dt className="text-label text-on-surface-variant">{t(messages.capacity)}</dt><dd className="mt-1 font-bold">{t(messages.groupRange, { min: data.minParticipants, max: data.maxParticipants })}</dd></div>
          <div className="py-3 sm:col-span-2"><dt className="text-label text-on-surface-variant">{t(messages.duration)}</dt><dd className="mt-1">{t(messages.minutes, { count: data.durationMinutes })}</dd></div>
        </dl>
        {data.availability === 'cancelled' && <StatusPanel tone="info" title={t(messages.cancelled)}><p>{t(scheduleMessages.cancelledExplanation)}</p></StatusPanel>}
        <footer className="sticky bottom-0 -mx-4 -mb-[max(1.5rem,env(safe-area-inset-bottom))] mt-auto flex flex-col gap-2 border-t border-outline-variant bg-surface-container-low px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {open ? <Button asChild variant="filled" className="w-full"><Link to={`/book/${encodeURIComponent(data.id)}?date=${encodeURIComponent(data.date)}`} onClick={onClose}>{t(messages.choosePlaces)}</Link></Button>
            : <Button variant="filled" className="w-full" disabled>{t(data.availability === 'cancelled' ? messages.cancelled : messages.full)}</Button>}
          <div className="flex justify-center"><LanguageMenu className="text-primary" /></div>
        </footer>
      </>}
  </Sheet>
}
