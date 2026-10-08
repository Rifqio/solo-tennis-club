import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { clubDayOfMonth, formatClubDateLong, formatClubDateMedium, formatClubWeekdayShort } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { clubToday, isClubDate } from '@shared/club-time'
import { publicScheduleWindow } from '@shared/schedule-window'
import { computeStripWindow } from './date-strip-window'
import { DateStrip } from './DateStrip'
import { SampleDataNotice } from './SampleDataNotice'
import { ScheduleList, ScheduleListPlaceholder } from './ScheduleList'
import { scheduleMessages } from './schedule.messages'
import { sessionTimings } from './session-timing'
import { useNow } from './use-now'
import { useSchedule } from './use-schedule'

export function SchedulePage() {
  const { language, t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const param = searchParams.get('date')
  const requestedDate = isClubDate(param) ? param : null
  const schedule = useSchedule(requestedDate)
  const [stripStart, setStripStart] = useState<string | null>(null)

  // The server decides today in WIB; until it answers, the device's WIB date keeps the controls usable.
  const fallbackToday = clubToday()
  const bounds = schedule.status === 'ready'
    ? { today: schedule.data.today, minDate: schedule.data.minDate, maxDate: schedule.data.maxDate }
    : { today: fallbackToday, ...publicScheduleWindow(fallbackToday) }
  const selected = requestedDate ?? (schedule.status === 'ready' ? schedule.data.date : bounds.today)
  const dates = computeStripWindow({ selected, currentStart: stripStart, ...bounds })
  const selectedLabel = formatClubDateLong(selected, language)

  const selectDate = (date: string) => {
    setStripStart(computeStripWindow({ selected: date, currentStart: dates[0], ...bounds })[0])
    setSearchParams({ date }, { preventScrollReset: true })
  }

  const sessionCount = schedule.status === 'ready' ? schedule.data.sessions.length : 0
  const now = useNow()
  const timings = schedule.status === 'ready' && selected === schedule.data.today ? sessionTimings(schedule.data.sessions, now) : null

  return (
    <>
      {/* The tab already names this screen; the heading exists for assistive technology only. */}
      <h1 className="sr-only">{t(scheduleMessages.heading)}</h1>

      <section aria-label={t(scheduleMessages.dateControls)} className="border-b border-outline-variant bg-surface-container-low">
        <div className="page-gutter mx-auto w-full max-w-[50rem] pb-2 pt-3 lg:max-w-[72rem]">
          <div>
          <DateStrip dates={dates} selected={selected} onSelect={selectDate} {...bounds} />
          </div>
        </div>
      </section>

      <div className="page-gutter mx-auto flex w-full max-w-[50rem] flex-col gap-3 pt-4 lg:max-w-[72rem]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-title font-bold text-on-surface">
            {formatClubDateMedium(selected, language)}
            <span className="ml-2 text-label font-normal text-on-surface-variant">WIB</span>
          </h2>
          {schedule.status === 'ready' && sessionCount > 0 && (
            <p role="status" className="text-label font-bold text-on-surface-variant">
              <span className="sr-only">{selectedLabel}: </span>
              {sessionCount === 1 ? t(scheduleMessages.sessionCountOne) : t(scheduleMessages.sessionCount, { count: sessionCount })}
            </p>
          )}
        </div>

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
          <div role="status" className="flex flex-col items-start gap-4 rounded-md bg-surface-container-lowest p-5">
            <div className="flex flex-col gap-1">
              <p className="text-title font-bold text-on-surface">{t(scheduleMessages.emptyHeading)}</p>
              {schedule.data.nextDate === null && <p className="text-on-surface-variant">{t(scheduleMessages.emptyNoFuture)}</p>}
            </div>
            {schedule.data.nextDate !== null && (
              // The next post on the trail: one control carrying the next scheduled day.
              <button
                type="button"
                onClick={() => selectDate(schedule.data.nextDate!)}
                className="state-layer flex w-full max-w-md items-center gap-4 rounded-md bg-primary p-2 pr-5 text-left text-on-primary"
              >
                <span aria-hidden="true" className="flex w-16 shrink-0 flex-col items-center rounded-sm bg-plate px-1 py-2 text-on-plate">
                  <span className="text-label font-bold">{formatClubWeekdayShort(schedule.data.nextDate, language)}</span>
                  <span className="font-display text-numeral font-bold tabular-nums">{clubDayOfMonth(schedule.data.nextDate)}</span>
                </span>
                <span className="flex flex-col">
                  <span className="text-label">{t(scheduleMessages.emptyShortcut)}</span>
                  <span className="font-bold">{formatClubDateMedium(schedule.data.nextDate, language)}</span>
                </span>
              </button>
            )}
          </div>
        ) : (
          <>
            {schedule.data.sessions.some(session => session.isSample) && <SampleDataNotice />}
            <ScheduleList sessions={schedule.data.sessions} timings={timings} now={now} />
          </>
        )}
      </div>
    </>
  )
}
