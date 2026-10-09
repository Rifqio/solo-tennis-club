import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { addClubDays } from '@shared/club-time'
import { IconButton } from '@/components/ui/button'
import { clubDayOfMonth, formatClubDateLong, formatClubMonthYear, formatClubWeekdayShort } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { popSpring, selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { CalendarPicker } from './CalendarPicker'
import { scheduleMessages } from './schedule.messages'

interface DateStripProps {
  dates: string[]
  selected: string
  today: string
  minDate: string
  maxDate: string
  onSelect: (date: string) => void
}

// Sits beside the band headline and only exists away from today; it pops in and out so its appearance reads as a
// response, not a jump. White label on a Deep Court pill, since small text never sits directly on Court Blue.
export function TodayChip({ selected, today, onSelect }: { selected: string; today: string; onSelect: (date: string) => void }) {
  const { t } = useI18n()
  return (
    <AnimatePresence initial={false}>
      {selected !== today && (
        <m.button
          key="today"
          type="button"
          onClick={() => onSelect(today)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.12 } }}
          transition={popSpring}
          className="pressable inline-flex min-h-12 items-center"
        >
          <span className="state-layer rounded-full bg-band-tile px-4 py-2 text-label font-semibold">{t(scheduleMessages.today)}</span>
        </m.button>
      )}
    </AnimatePresence>
  )
}

const TILE = 56
const GAP = 8

// Sits on the court band: the month with step and calendar buttons on Deep Court circles, then a strip of
// 56 by 72 date tiles. The selected tile is the band's one lime element, with the padel selection bar on top.
export function DateStrip({ dates, selected, today, minDate, maxDate, onSelect }: DateStripProps) {
  const { language, t } = useI18n()
  const stripRef = useRef<HTMLDivElement>(null)
  // Whole tiles only: as many as fit at 56px plus gaps, each stretched to fill the row, so none rests cut in half.
  const [visibleCells, setVisibleCells] = useState(dates.length)

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const measure = () => setVisibleCells(Math.max(1, Math.min(dates.length, Math.floor((strip.clientWidth + GAP) / (TILE + GAP)))))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(strip)
    return () => observer.disconnect()
  }, [dates.length])

  const reduceMotion = useReducedMotion()
  // On narrow phones the strip scrolls inside its own row; glide the selected tile into view without moving the page.
  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [selected, reduceMotion])

  const roundButton = 'bg-band-tile text-on-signboard'
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="whitespace-nowrap text-title font-bold">{formatClubMonthYear(selected, language)}</p>
        <div className="ml-auto flex items-center gap-2">
        <IconButton label={t(scheduleMessages.previousDate)} disabled={selected <= minDate} onClick={() => onSelect(addClubDays(selected, -1))} className={roundButton}>
          <ChevronLeft aria-hidden="true" className="size-6" />
        </IconButton>
        <IconButton label={t(scheduleMessages.nextDate)} disabled={selected >= maxDate} onClick={() => onSelect(addClubDays(selected, 1))} className={roundButton}>
          <ChevronRight aria-hidden="true" className="size-6" />
        </IconButton>
        <CalendarPicker selected={selected} today={today} minDate={minDate} maxDate={maxDate} onSelect={onSelect} triggerClassName={roundButton} />
        </div>
      </div>

      <div
        ref={stripRef}
        style={{ gridAutoColumns: `calc((100% - ${(visibleCells - 1) * GAP}px) / ${visibleCells})` }}
        className="grid snap-x snap-mandatory grid-flow-col gap-2 overflow-x-auto pb-4 [scrollbar-width:none] lg:max-w-[44rem]"
      >
        {dates.map(date => {
          const isSelected = date === selected
          const isToday = date === today
          const weekday = formatClubWeekdayShort(date, language)
          return (
            <button
              key={date}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${weekday} ${clubDayOfMonth(date)}, ${isToday ? t(scheduleMessages.today) + ', ' : ''}${formatClubDateLong(date, language)}`}
              onClick={() => onSelect(date)}
              className={cn(
                'pressable relative flex h-18 snap-start flex-col items-center justify-center gap-1 rounded-xs bg-band-tile transition-colors duration-200',
                isSelected ? 'text-on-accent' : 'text-on-signboard',
                isToday && !isSelected && 'ring-2 ring-inset ring-white',
              )}
            >
              {/* One shared lime tile, carrying its Deep Court selection bar, springs from the previous day to this one. */}
              {isSelected && (
                <m.span layoutId="day-selection" transition={selectionSpring} className="absolute inset-0 rounded-xs bg-accent">
                  <span className="absolute left-1/2 top-0 h-[3px] w-4 -translate-x-1/2 rounded-b-xs bg-band-tile" />
                </m.span>
              )}
              <span className="state-layer absolute inset-0 rounded-xs" />
              <span className={cn('relative text-label leading-none', isSelected && 'font-semibold')}>{weekday}</span>
              <span className="relative text-title font-bold leading-none tabular-nums">{clubDayOfMonth(date)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
