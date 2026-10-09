import { AnimatePresence, m } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'react-router-dom'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { clubDayOfMonth, formatClubDateLong, formatClubDateMedium, formatClubWeekdayShort } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { selectionHaptic } from '@/lib/haptics'
import { contentSpring, SHARED_AXIS_OFFSET } from '@/lib/motion'
import { useMediaQuery } from '@/lib/use-media-query'
import { addClubDays, clubToday, isClubDate } from '@shared/club-time'
import { publicScheduleWindow } from '@shared/schedule-window'
import { computeStripWindow } from './date-strip-window'
import { DateStrip, TodayChip } from './DateStrip'
import { SampleDataNotice } from './SampleDataNotice'
import { ScheduleList, ScheduleListPlaceholder } from './ScheduleList'
import { scheduleMessages } from './schedule.messages'
import { sessionTimings } from './session-timing'
import { useNow } from './use-now'
import { useSchedule } from './use-schedule'
import { DetailSheetHost } from './DetailSheetHost'
import type { DetailSheetHandle } from './DetailSheetHost'
import { CourtBand } from '../layout/CourtBand'
import { CourtLines } from '@/components/brand/court-lines'
import { ALL_LEVELS, AvailableOnlySwitch, LevelTabs, TimeChips } from './ScheduleFilters'
import { isUnavailable } from './session-booking'
import { useSessionPlayers } from './use-session-players'

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

  // +1 when travelling to a later day, -1 to an earlier one: the list slides in from that side (shared axis).
  const [direction, setDirection] = useState(1)
  const isTouch = useMediaQuery('(pointer: coarse)')

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

  const markSession = (id: string) => {
    setMarkedId(id)
    selectionHaptic()
    document.querySelector(`[data-session-card="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return (
    <>
      {/* The band holds the date (month, step buttons, tiles); the content below never repeats it as a heading.
          The visually hidden heading is where focus returns when a sheet closes. */}
      <CourtBand title={t(scheduleMessages.heading)} action={<TodayChip selected={selected} today={bounds.today} onSelect={selectDate} />}>
        <section aria-label={t(scheduleMessages.dateControls)}>
          <DateStrip dates={dates} selected={selected} onSelect={selectDate} {...bounds} />
        </section>
      </CourtBand>

      <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-3 pt-3 lg:max-w-[72rem]">
        <h2 data-schedule-heading tabIndex={-1} className="sr-only">{selectedLabel}</h2>
        {schedule.status === 'ready' && sessionCount > 0 && (
          <>
            <LevelTabs levels={levels} selected={activeLevel} onSelect={value => { setLevel(value); setMarkedId(null) }} />
            <AvailableOnlySwitch checked={availableOnly} onChange={setAvailableOnly} hiddenCount={hiddenCount} />
            <p role="status" className="sr-only">
              {selectedLabel}: {sessionCount === 1 ? t(scheduleMessages.sessionCountOne) : t(scheduleMessages.sessionCount, { count: sessionCount })}
            </p>
            <TimeChips sessions={visibleSessions} selectedId={markedId} onSelect={markSession} />
          </>
        )}

        <div ref={resultsRef} className="relative" style={{ minHeight: schedule.status === 'ready' ? undefined : heldHeight ?? undefined }}>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <m.div
            key={selected}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ opacity: 0, x: dir * SHARED_AXIS_OFFSET }),
              center: { opacity: 1, x: 0 },
              exit: (dir: number) => ({ opacity: 0, x: dir * -SHARED_AXIS_OFFSET, transition: { duration: 0.09 } }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
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
              </>
            ) : schedule.status === 'error' ? (
              <StatusPanel tone="error" title={t(scheduleMessages.error)} action={{ label: t(commonMessages.retry), onAction: schedule.retry }}>
                <p>{t(scheduleMessages.errorFor, { date: selectedLabel })}</p>
              </StatusPanel>
            ) : sessionCount === 0 ? (
              <div role="status" className="relative isolate flex flex-col items-start gap-4 overflow-hidden rounded-sm bg-surface-container-lowest p-5">
                <CourtLines className="pointer-events-none absolute -right-16 -top-10 -z-10 h-56 text-on-surface/8" />
                <div className="flex flex-col gap-1">
                  <p className="text-title font-bold text-on-surface">{t(scheduleMessages.emptyHeading)}</p>
                  {schedule.data.nextDate === null && <p className="text-on-surface-variant">{t(scheduleMessages.emptyNoFuture)}</p>}
                </div>
                {schedule.data.nextDate !== null && (
                  // The next post on the trail: one control carrying the next scheduled day.
                  <button
                    type="button"
                    onClick={() => selectDate(schedule.data.nextDate!)}
                    className="state-layer pressable flex w-full max-w-md items-center gap-4 rounded-sm bg-cta p-2 pr-5 text-left text-on-cta"
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
                )}
              </div>
            ) : (
              <>
                {schedule.data.sessions.some(session => session.isSample) && <SampleDataNotice />}
                {visibleSessions.length === 0 ? (
                  <div role="status" className="flex flex-col items-start gap-3 rounded-sm bg-surface-container-lowest p-5">
                    <p className="text-on-surface">{t(scheduleMessages.noMatch)}</p>
                    <Button variant="outlined" onClick={() => { setLevel(ALL_LEVELS); setAvailableOnly(false) }}>{t(scheduleMessages.showAll)}</Button>
                  </div>
                ) : (
                  <ScheduleList sessions={visibleSessions} timings={timings} now={now} markedId={markedId} players={players.status === 'ready' ? players.sessions : undefined} onOpen={(id, trigger) => detailSheet.current?.open(id, trigger, visibleSessions.find(session => session.id === id))} />
                )}
              </>
            )}
          </m.div>
        </AnimatePresence>
        </div>
      </div>
      <DetailSheetHost ref={detailSheet} initialId={linkedSessionId} knownPlayers={{ date: selected, state: players }} />
    </>
  )
}
