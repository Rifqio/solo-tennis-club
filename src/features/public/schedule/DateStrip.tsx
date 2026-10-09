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

// Day markers along the trail: month and step controls on top, seven whole-cell markers below.
export function DateStrip({ dates, selected, today, minDate, maxDate, onSelect }: DateStripProps) {
  const { language, t } = useI18n()
  const stripRef = useRef<HTMLDivElement>(null)
  // Whole cells only: as many 48px day markers as fit, each sized to fill the row exactly, so none rests cut in half.
  const [visibleCells, setVisibleCells] = useState(dates.length)

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const measure = () => setVisibleCells(Math.max(1, Math.min(dates.length, Math.floor(strip.clientWidth / 48))))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(strip)
    return () => observer.disconnect()
  }, [dates.length])

  const reduceMotion = useReducedMotion()
  // On narrow phones the strip scrolls inside its own row; glide the selected marker into view without moving the page.
  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [selected, reduceMotion])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        <p className="mr-auto min-w-0 flex-1 break-words font-display text-title font-bold uppercase tracking-wide text-on-surface">{formatClubMonthYear(selected, language)}</p>
        {/* The Today chip only exists away from today; it pops in and out so its appearance reads as a response, not a jump. */}
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
              className="pressable mr-1 inline-flex min-h-12 items-center px-1"
            >
              <span className="state-layer rounded-sm border border-outline px-3 py-1.5 text-label font-bold text-on-surface">{t(scheduleMessages.today)}</span>
            </m.button>
          )}
        </AnimatePresence>
        <IconButton label={t(scheduleMessages.previousDate)} disabled={selected <= minDate} onClick={() => onSelect(addClubDays(selected, -1))}>
          <ChevronLeft aria-hidden="true" className="size-6" />
        </IconButton>
        <IconButton label={t(scheduleMessages.nextDate)} disabled={selected >= maxDate} onClick={() => onSelect(addClubDays(selected, 1))}>
          <ChevronRight aria-hidden="true" className="size-6" />
        </IconButton>
        <CalendarPicker selected={selected} today={today} minDate={minDate} maxDate={maxDate} onSelect={onSelect} />
      </div>

      <div ref={stripRef} style={{ gridAutoColumns: `calc(100% / ${visibleCells})` }} className="grid snap-x snap-mandatory grid-flow-col overflow-x-auto [scrollbar-width:none] lg:max-w-[42rem]">
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
              className="pressable flex min-h-[4.75rem] snap-start px-0.5 py-1"
            >
              <span className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 rounded-md transition-colors duration-200',
                isSelected ? 'text-on-primary' : isToday ? 'text-primary ring-2 ring-inset ring-primary' : 'text-on-surface',
              )}>
                {/* One shared selection tile springs from the previous day to this one. */}
                {isSelected && <m.span layoutId="day-selection" transition={selectionSpring} className="absolute inset-0 rounded-md bg-primary" />}
                <span className="state-layer absolute inset-0 rounded-md" />
                <span className={cn('relative text-label leading-none transition-colors duration-200', isSelected || isToday ? 'font-bold' : 'text-on-surface-variant')}>{weekday}</span>
                <span className="relative font-display text-headline font-bold leading-none tabular-nums">{clubDayOfMonth(date)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
