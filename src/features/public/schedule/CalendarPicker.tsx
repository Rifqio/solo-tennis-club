import { CalendarDays } from 'lucide-react'
import { Popover } from 'radix-ui'
import { lazy, Suspense, useState } from 'react'
import { Drawer } from 'vaul'
import { formatClubDateMedium } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { scheduleMessages } from './schedule.messages'

interface CalendarPickerProps {
  selected: string
  today: string
  minDate: string
  maxDate: string
  onSelect: (date: string) => void
}

// The calendar (react-day-picker and date-fns) loads only when needed; touching or hovering the button starts the download.
const loadCalendar = () => import('@/components/ui/club-calendar')
const ClubCalendar = lazy(() => loadCalendar().then(module => ({ default: module.ClubCalendar })))
const preload = { onPointerEnter: () => void loadCalendar(), onTouchStart: () => void loadCalendar(), onFocus: () => void loadCalendar() }

// Holds the sheet's height while the calendar arrives, and only shows after 150ms so a fast load never flashes.
function CalendarPlaceholder() {
  return <div aria-hidden="true" className="appear-late h-[22rem] rounded-md bg-surface-container" />
}

const triggerClass = 'state-layer pressable inline-flex size-12 shrink-0 items-center justify-center rounded-full text-on-surface-variant'

// The calendar button. Phones get a bottom sheet (thumb-reachable, drag to dismiss); wider screens a popover anchored to the button.
// Choosing a day applies it at once and closes, one tap like a native picker.
export function CalendarPicker({ selected, today, minDate, maxDate, onSelect }: CalendarPickerProps) {
  const { language, t } = useI18n()
  const isPhone = useMediaQuery('(max-width: 39.99rem)')
  const [open, setOpen] = useState(false)

  const choose = (date: string) => { setOpen(false); onSelect(date) }
  const calendar = (
    <Suspense fallback={<CalendarPlaceholder />}>
      <ClubCalendar selected={selected} today={today} minDate={minDate} maxDate={maxDate} onSelect={choose} />
    </Suspense>
  )
  const trigger = <CalendarDays aria-hidden="true" className="size-6" />

  if (isPhone) {
    return (
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger className={triggerClass} aria-label={t(scheduleMessages.chooseDate)} data-icon-only {...preload}>{trigger}</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-scrim" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-1rem)] flex-col rounded-t-xl bg-surface-container-low px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-on-surface shadow-sheet outline-none">
            <div aria-hidden="true" className="mx-auto mb-1 mt-3 h-1 w-8 shrink-0 rounded-full bg-outline" />
            {/* Header names the task, then shows the current choice in the sign voice so the sheet confirms what is set. */}
            <div className="flex flex-col gap-1 px-2 pb-3 pt-3">
              <Drawer.Title className="text-label font-bold text-on-surface-variant">{t(scheduleMessages.chooseDate)}</Drawer.Title>
              <Drawer.Description className="font-display text-headline font-bold uppercase tracking-wide text-on-surface">
                {formatClubDateMedium(selected, language)}
              </Drawer.Description>
            </div>
            <div className="overflow-y-auto overscroll-contain border-t border-outline-variant pt-2">{calendar}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className={triggerClass} aria-label={t(scheduleMessages.chooseDate)} data-icon-only {...preload}>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          aria-label={t(scheduleMessages.chooseDate)}
          className={cn(
            'z-50 w-[23rem] origin-[var(--radix-popover-content-transform-origin)] rounded-lg bg-surface-container-low p-3 text-on-surface shadow-menu outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          )}
        >
          {calendar}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
