import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { addClubDays, isClubDate } from '@shared/club-time'
import { IconButton } from '@/components/ui/button'
import { clubDayOfMonth, formatClubDateLong, formatClubMonthYear, formatClubWeekdayShort } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { popSpring, selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
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
  const pickerRef = useRef<HTMLInputElement>(null)
  const pickerId = useId()
  const errorId = useId()
  const [pickerError, setPickerError] = useState(false)
  const [showInlinePicker, setShowInlinePicker] = useState(false)
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

  const openPicker = () => {
    const input = pickerRef.current
    if (input && typeof input.showPicker === 'function') {
      try { input.showPicker(); return } catch { /* Some browsers refuse showPicker; fall through to the visible field. */ }
    }
    setShowInlinePicker(true)
    requestAnimationFrame(() => pickerRef.current?.focus())
  }

  const pick = (value: string) => {
    if (!value) return
    if (!isClubDate(value) || value < minDate || value > maxDate) { setPickerError(true); return }
    setPickerError(false)
    if (value !== selected) onSelect(value)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <p className="mr-auto font-display text-title font-bold uppercase tracking-wide text-on-surface">{formatClubMonthYear(selected, language)}</p>
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
        <IconButton label={t(scheduleMessages.chooseDate)} aria-controls={pickerId} onClick={openPicker}>
          <CalendarDays aria-hidden="true" className="size-6" />
        </IconButton>
      </div>

      {/* Native date picker: opened by the calendar button, and shown as a labeled field where showPicker is unavailable. */}
      <div className={cn('flex flex-col gap-1', showInlinePicker || pickerError ? '' : 'sr-only')}>
        <label htmlFor={pickerId} className="text-label font-bold">{t(scheduleMessages.chooseDate)}</label>
        <input
          ref={pickerRef}
          id={pickerId}
          type="date"
          value={selected}
          min={minDate}
          max={maxDate}
          tabIndex={showInlinePicker ? 0 : -1}
          aria-invalid={pickerError || undefined}
          aria-describedby={pickerError ? errorId : undefined}
          onChange={event => pick(event.target.value)}
          className={cn('min-h-12 w-full rounded-sm border bg-surface px-4 text-body text-on-surface sm:max-w-72', pickerError ? 'border-error' : 'border-outline')}
        />
        {pickerError && (
          <p id={errorId} role="alert" className="text-label text-error">
            {t(scheduleMessages.dateOutOfRange, { min: formatClubDateLong(minDate, language), max: formatClubDateLong(maxDate, language) })}
          </p>
        )}
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
