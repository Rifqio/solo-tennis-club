import { AnimatePresence, LayoutGroup, m, useReducedMotion } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadFailed } from '@/components/ui/load-failed'
import { SlowNotice } from '@/components/ui/slow-notice'
import { clubDayOfMonth, formatClubDateLong, formatClubDateMedium, formatClubMonthShort, formatClubMonthYear, formatClubWeekdayShort } from '@/i18n/format'
import type { Language } from '@/i18n/types'
import { useI18n } from '@/i18n/use-i18n'
import { selectionHaptic } from '@/lib/haptics'
import { contentSpring, SHARED_AXIS_OFFSET } from '@/lib/motion'
import { useMediaQuery } from '@/lib/use-media-query'
import { addClubDays, clubToday, isClubDate } from '@shared/club-time'
import { publicScheduleWindow } from '@shared/schedule-window'
import { computeStripWindow } from './date-strip-window'
import { DateStrip, TodayChip } from './DateStrip'
import { CalendarPicker } from './CalendarPicker'
import { SampleDataNotice } from './SampleDataNotice'
import { ScheduleList, ScheduleListPlaceholder } from './ScheduleList'
import { scheduleMessages } from './schedule.messages'
import { sessionTimings } from './session-timing'
import { useNow } from './use-now'
import { useSchedule } from './use-schedule'
import { DetailSheetHost } from './DetailSheetHost'
import type { DetailSheetHandle } from './DetailSheetHost'
import { CourtBand } from '../layout/CourtBand'
import { ALL_LEVELS, AvailableOnlySwitch, LevelTabs, TimeChips } from './ScheduleFilters'
import { isUnavailable } from './session-booking'
import { useSessionPlayers } from './use-session-players'
import { SessionDetailPanel } from './SessionDetailPanel'
import { SessionRows } from './SessionRows'

// "11-17 Oktober 2026", or "28 Sep - 4 Okt 2026" when the week crosses a month.
function weekLabel(dates: string[], language: Language) {
  const first = dates[0], last = dates[dates.length - 1]
  const sameMonth = first.slice(0, 7) === last.slice(0, 7)
  return sameMonth
    ? `${clubDayOfMonth(first)}-${clubDayOfMonth(last)} ${formatClubMonthYear(last, language)}`
    : `${clubDayOfMonth(first)} ${formatClubMonthShort(first.slice(0, 7), language)} - ${clubDayOfMonth(last)} ${formatClubMonthShort(last.slice(0, 7), language)} ${last.slice(0, 4)}`
}

export function SchedulePage() {
  const { language, t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const param = searchParams.get('date')
  const requestedDate = isClubDate(param) ? param : null
  const schedule = useSchedule(requestedDate)
  const [stripStart, setStripStart] = useState<string | null>(null)
  const [linkedSessionId] = useState<string | null>(() => {
    const session = searchParams.get('session')
    return session && /^[a-z0-9]{1,64}$/.test(session) ? session : null
  })
  const detailSheet = useRef<DetailSheetHandle>(null)

  // The server decides today in WIB; until it answers, the device's WIB date keeps the controls usable.
  const fallbackToday = clubToday()
  const bounds = schedule.status === 'ready'
    ? { today: schedule.data.today, minDate: schedule.data.minDate, maxDate: schedule.data.maxDate }
    : { today: fallbackToday, ...publicScheduleWindow(fallbackToday) }
  const selected = requestedDate ?? (schedule.status === 'ready' ? schedule.data.date : bounds.today)
  const dates = computeStripWindow({ selected, currentStart: stripStart, ...bounds })
  const selectedLabel = formatClubDateLong(selected, language)
  // The week tiles keep the last counts while another day loads, so their second line does not blink.
  const [dayCounts, setDayCounts] = useState<Record<string, number> | undefined>(undefined)
  if (schedule.status === 'ready' && schedule.data.dayCounts !== dayCounts) setDayCounts(schedule.data.dayCounts)

  // +1 when travelling to a later day, -1 to an earlier one: the list slides in from that side (shared axis).
  const [direction, setDirection] = useState(1)
  const reduceMotion = useReducedMotion()
  const isTouch = useMediaQuery('(pointer: coarse)')
  // Desktop shows the day as rows with the chosen session in a side panel; phones and tablets keep cards and a sheet.
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const [pickedId, setPickedId] = useState<string | null>(linkedSessionId)

  // Day changes must never collapse the page: on phones a sudden drop in page height makes the browser toolbar
  // show or hide, which resizes the viewport and makes the fixed navigation bar jump. The results area keeps its
  // previous height until the new day's data arrives, and the outgoing list is lifted out of flow (popLayout)
  // instead of leaving an empty gap while it fades.
  const resultsRef = useRef<HTMLDivElement>(null)
  const [heldHeight, setHeldHeight] = useState<number | null>(null)

  const [level, setLevel] = useState(ALL_LEVELS)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [markedId, setMarkedId] = useState<string | null>(null)

  const selectDate = (date: string) => {
    if (date === selected) return
    setMarkedId(null)
    setHeldHeight(resultsRef.current?.offsetHeight ?? null)
    setDirection(date > selected ? 1 : -1)
    setStripStart(computeStripWindow({ selected: date, currentStart: dates[0], ...bounds })[0])
    setSearchParams({ date }, { preventScrollReset: true })
    selectionHaptic()
  }

  // Swipe the list sideways to step a day, like paging a native calendar. Buttons and the strip remain the primary path.
  const handleSwipe = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const travelled = Math.abs(info.offset.x) > 72 || (Math.abs(info.velocity.x) > 500 && Math.abs(info.offset.x) > 24)
    if (!travelled) return
    const step = info.offset.x < 0 ? 1 : -1
    const target = addClubDays(selected, step)
    if (target >= bounds.minDate && target <= bounds.maxDate) selectDate(target)
  }

  const sessionCount = schedule.status === 'ready' ? schedule.data.sessions.length : 0
  const players = useSessionPlayers(selected)
  const now = useNow()
  const timings = schedule.status === 'ready' && selected === schedule.data.today ? sessionTimings(schedule.data.sessions, now) : null

  // Filters apply to the loaded day. A level that the new day lacks falls back to "All" without a reset effect.
  const daySessions = schedule.status === 'ready' ? schedule.data.sessions : []
  const levels = [...new Set(daySessions.map(session => session.levelName).filter(Boolean))]
  const activeLevel = levels.includes(level) ? level : ALL_LEVELS
  const levelSessions = activeLevel === ALL_LEVELS ? daySessions : daySessions.filter(session => session.levelName === activeLevel)
  const visibleSessions = availableOnly ? levelSessions.filter(session => !isUnavailable(session, timings?.get(session.id))) : levelSessions
  const hiddenCount = levelSessions.length - visibleSessions.length
  const openCount = daySessions.filter(session => !isUnavailable(session, timings?.get(session.id))).length
  // The panel follows the member's choice; until they choose, it shows the first session still open, else the first.
  const livePanel = visibleSessions.find(session => session.id === pickedId)
    ?? visibleSessions.find(session => !isUnavailable(session, timings?.get(session.id))) ?? visibleSessions[0] ?? null
  // While another day loads, the panel keeps the session it showed, so it neither blanks nor slides in again.
  const [heldPanel, setHeldPanel] = useState(livePanel)
  if (schedule.status === 'ready' && heldPanel !== livePanel) setHeldPanel(livePanel)
  const panelSession = schedule.status === 'ready' ? livePanel : heldPanel

  const markSession = (id: string) => {
    setMarkedId(id)
    selectionHaptic()
    document.querySelector(`[data-session-card="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <>
      {/* The band holds the date (month, step buttons, tiles); the content below never repeats it as a heading.
          The visually hidden heading is where focus returns when a sheet closes. */}
      {isDesktop ? (
        // D2: the headline with the week it shows, Hari ini and the calendar at its end, then the week between arrows.
        <CourtBand>
          <div className="flex flex-wrap items-end justify-between gap-4 pb-5 pt-1">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-display font-bold">{t(scheduleMessages.heading)}</h1>
              <p className="text-title font-semibold tabular-nums">{weekLabel(dates, language)}</p>
            </div>
            <div className="flex items-center gap-2">
              <TodayChip selected={selected} today={bounds.today} onSelect={selectDate} />
              <CalendarPicker selected={selected} {...bounds} onSelect={selectDate} triggerClassName="bg-band-tile text-on-signboard" />
            </div>
          </div>
          <section aria-label={t(scheduleMessages.dateControls)}>
            <DateStrip layout="week" dates={dates} selected={selected} onSelect={selectDate} counts={dayCounts} {...bounds} />
          </section>
        </CourtBand>
      ) : (
        <CourtBand title={t(scheduleMessages.heading)} action={<TodayChip selected={selected} today={bounds.today} onSelect={selectDate} />}>
          <section aria-label={t(scheduleMessages.dateControls)}>
            <DateStrip dates={dates} selected={selected} onSelect={selectDate} {...bounds} />
          </section>
        </CourtBand>
      )}

      <div className="page-gutter desk-column mx-auto flex w-full max-w-[50rem] flex-col gap-3 pt-3 lg:flex-row lg:items-start lg:gap-6 lg:pt-6">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="lg:flex lg:flex-col lg:gap-0.5">
          <h2 data-schedule-heading tabIndex={-1} className="sr-only focus:outline-none lg:not-sr-only lg:text-headline lg:font-bold">{selectedLabel} <span className="text-label font-medium text-on-surface-variant">WIB</span></h2>
          {isDesktop && schedule.status === 'ready' && sessionCount > 0 && (
            <p className="text-label text-on-surface-variant">
              {sessionCount === 1 ? t(scheduleMessages.sessionCountOne) : t(scheduleMessages.sessionCount, { count: sessionCount })} · {t(scheduleMessages.openCount, { count: openCount })}
            </p>
          )}
        </div>
        {schedule.status === 'ready' && sessionCount > 0 && (
          <>
            <LevelTabs levels={levels} selected={activeLevel} onSelect={value => { setLevel(value); setMarkedId(null) }} />
            <AvailableOnlySwitch checked={availableOnly} onChange={setAvailableOnly} hiddenCount={hiddenCount} />
            <p role="status" className="sr-only">
              {selectedLabel}: {sessionCount === 1 ? t(scheduleMessages.sessionCountOne) : t(scheduleMessages.sessionCount, { count: sessionCount })}
            </p>
            {!isDesktop && <TimeChips sessions={visibleSessions} selectedId={markedId} onSelect={markSession} />}
          </>
        )}

        {/* The day's slide stays inside its column; the clip margin keeps focus rings at the edges visible. */}
        <div ref={resultsRef} className="relative overflow-x-clip [overflow-clip-margin:0.25rem]" style={{ minHeight: schedule.status === 'ready' ? undefined : heldHeight ?? undefined }}>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <m.div
            key={selected}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ opacity: 0, x: dir * SHARED_AXIS_OFFSET }),
              center: { opacity: 1, x: 0 },
              exit: (dir: number) => ({ opacity: 0, x: dir * -SHARED_AXIS_OFFSET, transition: { duration: 0.09 } }),
            }}
            initial={reduceMotion ? false : 'enter'}
            animate="center"
            exit={reduceMotion ? undefined : 'exit'}
            transition={contentSpring}
            drag={isTouch ? 'x' : false}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            dragSnapToOrigin
            onDragEnd={handleSwipe}
            className="flex flex-col gap-3"
          >
            {schedule.status === 'loading' ? (
              <>
                <p role="status" className="sr-only">{t(scheduleMessages.loadingFor, { date: selectedLabel })}</p>
                <ScheduleListPlaceholder />
                <SlowNotice onRetry={schedule.retry} />
              </>
            ) : schedule.status === 'error' ? (
              <LoadFailed title={t(scheduleMessages.errorFor, { date: selectedLabel })} onRetry={schedule.retry} />
            ) : sessionCount === 0 ? (
              // The day already slides in, so the picture does not settle in on top of it.
              schedule.data.nextDate !== null ? (
                <EmptyState scene="no-sessions" still title={t(scheduleMessages.emptyHeading)}
                  body={t(scheduleMessages.emptyNext, { date: formatClubDateMedium(schedule.data.nextDate, language) })}
                  action={
                    // The next post on the trail: one control carrying the next scheduled day.
                    <button
                      type="button"
                      onClick={() => selectDate(schedule.data.nextDate!)}
                      className="state-layer pressable flex w-full max-w-sm items-center gap-4 rounded-sm bg-cta p-2 pr-5 text-left text-on-cta"
                    >
                      <span aria-hidden="true" className="flex w-14 shrink-0 flex-col items-center rounded-xs bg-primary px-1 py-2 text-on-primary">
                        <span className="text-label font-bold">{formatClubWeekdayShort(schedule.data.nextDate, language)}</span>
                        <span className="text-title font-bold tabular-nums">{clubDayOfMonth(schedule.data.nextDate)}</span>
                      </span>
                      <span className="flex flex-col">
                        <span className="text-label">{t(scheduleMessages.emptyShortcut)}</span>
                        <span className="font-semibold">{formatClubDateMedium(schedule.data.nextDate, language)}</span>
                      </span>
                    </button>
                  } />
              ) : (
                <EmptyState scene="no-sessions" still title={t(scheduleMessages.emptyNoFutureTitle)} body={t(scheduleMessages.emptyNoFuture)}
                  action={<Button asChild variant="outlined"><Link to="/" viewTransition data-nav="tab">{t(scheduleMessages.seeClub)}</Link></Button>} />
              )
            ) : (
              <>
                {schedule.data.sessions.some(session => session.isSample) && <SampleDataNotice />}
                {visibleSessions.length === 0 ? (
                  <div role="status" className="flex flex-col items-start gap-3 rounded-sm bg-surface-container-lowest p-5">
                    <p className="text-on-surface">{t(scheduleMessages.noMatch)}</p>
                    <Button variant="outlined" onClick={() => { setLevel(ALL_LEVELS); setAvailableOnly(false) }}>{t(scheduleMessages.showAll)}</Button>
                  </div>
                ) : isDesktop ? (
                  // Each day has its own highlight, so the new day's does not fly in from the old day's row.
                  <LayoutGroup id={selected}>
                    <SessionRows sessions={visibleSessions} timings={timings} selectedId={panelSession?.id ?? null} onSelect={id => { setPickedId(id); selectionHaptic() }} />
                  </LayoutGroup>
                ) : (
                  <ScheduleList sessions={visibleSessions} timings={timings} now={now} markedId={markedId} players={players.status === 'ready' ? players.sessions : undefined} onOpen={(id, trigger) => detailSheet.current?.open(id, trigger, visibleSessions.find(session => session.id === id))} />
                )}
              </>
            )}
          </m.div>
        </AnimatePresence>
        </div>
      </div>
      {isDesktop && panelSession && (
        <div className="w-[24rem] shrink-0 xl:w-[28rem]">
          <SessionDetailPanel id={panelSession.id} seed={panelSession} knownPlayers={{ date: selected, state: players }} />
        </div>
      )}
      </div>
      {!isDesktop && <DetailSheetHost ref={detailSheet} initialId={linkedSessionId} knownPlayers={{ date: selected, state: players }} />}
    </>
  )
}
