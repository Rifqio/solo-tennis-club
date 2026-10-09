import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import type { ChevronProps } from 'react-day-picker'
import { enGB, id } from 'react-day-picker/locale'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'

const calendarMessages = {
  previousMonth: { id: 'Bulan sebelumnya', en: 'Previous month' },
  nextMonth: { id: 'Bulan berikutnya', en: 'Next month' },
}

function CalendarChevron({ orientation, className }: ChevronProps) {
  const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
  return <Icon aria-hidden="true" className={cn('size-6', className)} />
}

interface ClubCalendarProps {
  selected: string
  today: string
  minDate: string
  maxDate: string
  onSelect: (date: string) => void
}

// Club dates are plain calendar days (YYYY-MM-DD, already decided in WIB by the server). The calendar works on
// floating local dates built from those numbers and reads the same numbers back, so the device's own time zone
// can never shift a day. (DayPicker's experimental timeZone mode broke the grid on devices far from WIB.)
const toLocal = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}
const fromLocal = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')

// The month grid: 48px square day cells, the selected day in ink with lime digits (the scoreboard look),
// today as an inset Deep Court ring, days outside the public window muted and not selectable.
export function ClubCalendar({ selected, today, minDate, maxDate, onSelect }: ClubCalendarProps) {
  const { language, t } = useI18n()
  const selectedDay = toLocal(selected)

  return (
    <DayPicker
      mode="single"
      required
      locale={language === 'id' ? id : enGB}
      today={toLocal(today)}
      selected={selectedDay}
      defaultMonth={selectedDay}
      startMonth={toLocal(minDate)}
      endMonth={toLocal(maxDate)}
      disabled={[{ before: toLocal(minDate) }, { after: toLocal(maxDate) }]}
      onSelect={date => { if (date) onSelect(fromLocal(date)) }}
      animate
      autoFocus
      navLayout="after"
      labels={{ labelPrevious: () => t(calendarMessages.previousMonth), labelNext: () => t(calendarMessages.nextMonth) }}
      components={{ Chevron: CalendarChevron }}
      classNames={{
        root: 'w-full select-none',
        months: 'relative flex flex-col',
        month: 'flex flex-col gap-1',
        month_caption: 'flex h-12 items-center pl-1',
        caption_label: 'text-title font-semibold text-on-surface',
        nav: 'absolute right-0 top-0 z-10 flex gap-2',
        button_previous: 'state-layer pressable inline-flex size-12 items-center justify-center rounded-full border border-outline text-on-surface disabled:cursor-not-allowed disabled:border-outline-variant disabled:opacity-40',
        button_next: 'state-layer pressable inline-flex size-12 items-center justify-center rounded-full border border-outline text-on-surface disabled:cursor-not-allowed disabled:border-outline-variant disabled:opacity-40',
        month_grid: 'w-full border-separate border-spacing-1 overflow-hidden',
        weekdays: '',
        weekday: 'h-8 text-center text-label font-normal text-on-surface-variant',
        weeks: 'relative',
        week: '',
        day: 'group p-0 text-center',
        day_button: 'state-layer pressable relative mx-auto flex min-h-12 w-full min-w-11 items-center justify-center rounded-xs bg-surface-container-lowest text-title font-semibold tabular-nums text-on-surface transition-colors duration-200 group-data-[selected=true]:bg-ink group-data-[selected=true]:font-bold group-data-[selected=true]:text-accent dark:group-data-[selected=true]:bg-ink-raised group-data-[today=true]:ring-2 group-data-[today=true]:ring-inset group-data-[today=true]:ring-primary group-data-[today=true]:text-primary group-data-[selected=true]:ring-0 group-data-[selected=true]:group-data-[today=true]:text-accent disabled:cursor-not-allowed disabled:bg-transparent disabled:font-normal disabled:text-on-surface-variant disabled:opacity-60',
        selected: '',
        today: '',
        disabled: '',
        outside: 'invisible',
        hidden: 'invisible',
        weeks_before_enter: 'cal-enter-from-left',
        weeks_after_enter: 'cal-enter-from-right',
        weeks_before_exit: 'cal-exit-to-right',
        weeks_after_exit: 'cal-exit-to-left',
        caption_after_enter: 'cal-fade-in',
        caption_before_enter: 'cal-fade-in',
        caption_after_exit: 'cal-fade-out',
        caption_before_exit: 'cal-fade-out',
      }}
    />
  )
}
