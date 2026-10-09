import { m } from 'motion/react'
import { Switch } from 'radix-ui'
import { useId } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import { selectionHaptic } from '@/lib/haptics'
import { selectionSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { PublicSessionSummary } from '@shared/api/public'
import { scheduleMessages } from './schedule.messages'

export const ALL_LEVELS = '*'

// After the padel club tabs: "All" then each level present that day, with an underline that slides between them.
// Hidden when the day has a single level, since there would be nothing to choose.
export function LevelTabs({ levels, selected, onSelect }: { levels: string[]; selected: string; onSelect: (level: string) => void }) {
  const { t } = useI18n()
  if (levels.length < 2) return null
  const options = [{ value: ALL_LEVELS, label: t(scheduleMessages.allLevels) }, ...levels.map(level => ({ value: level, label: level }))]
  return (
    <div role="group" aria-label={t(scheduleMessages.levelFilter)} className="-mx-1 flex overflow-x-auto border-b border-outline-variant [scrollbar-width:none]">
      {options.map(option => {
        const active = option.value === selected
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => { if (!active) { selectionHaptic(); onSelect(option.value) } }}
            className={cn(
              'pressable relative flex min-h-12 shrink-0 items-center px-3 text-label transition-colors duration-200',
              active ? 'font-semibold text-on-surface' : 'text-on-surface-variant',
            )}
          >
            <span className="state-layer absolute inset-x-0 inset-y-1 rounded-xs" />
            <span className="relative whitespace-nowrap">{option.label}</span>
            {active && <m.span layoutId="level-underline" transition={selectionSpring} className="absolute inset-x-3 -bottom-px h-[3px] rounded-t-xs bg-primary" />}
          </button>
        )
      })}
    </div>
  )
}

// "Show available only": hides full, cancelled and ended sessions and says how many it hid.
export function AvailableOnlySwitch({ checked, onChange, hiddenCount }: { checked: boolean; onChange: (value: boolean) => void; hiddenCount: number }) {
  const { t } = useI18n()
  const labelId = useId()
  const hint = checked && hiddenCount > 0 ? (hiddenCount === 1 ? t(scheduleMessages.hiddenOne) : t(scheduleMessages.hiddenCount, { count: hiddenCount })) : null
  return (
    <div className="flex min-h-12 items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col">
        <label id={labelId} htmlFor={labelId + '-switch'} className="font-semibold text-on-surface">{t(scheduleMessages.availableOnly)}</label>
        {hint && <p role="status" className="text-label text-on-surface-variant">{hint}</p>}
      </div>
      <Switch.Root
        id={labelId + '-switch'}
        checked={checked}
        onCheckedChange={value => { selectionHaptic(); onChange(value) }}
        className="group relative inline-flex h-12 w-[3.25rem] shrink-0 items-center"
      >
        <span className="absolute inset-x-0 inset-y-2 rounded-full border border-outline bg-surface-container transition-colors duration-200 group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary" />
        <Switch.Thumb className="relative ml-1 size-6 rounded-full bg-white shadow-menu transition-transform duration-200 data-[state=checked]:translate-x-5 motion-reduce:transition-none" />
      </Switch.Root>
    </div>
  )
}

// After the padel slot row: one chip per session start. Tapping one brings its card into view and marks it.
// Full and cancelled sessions keep their time and show their state word under it.
export function TimeChips({ sessions, selectedId, onSelect }: { sessions: PublicSessionSummary[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const { t } = useI18n()
  if (sessions.length < 2) return null
  return (
    <div role="group" aria-label={t(scheduleMessages.startTimes)} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
      {sessions.map(session => {
        const active = session.id === selectedId
        const state = session.availability === 'full' || session.availability === 'cancelled' ? t(scheduleMessages.status[session.availability]) : null
        return (
          <button
            key={session.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(session.id)}
            className={cn(
              'state-layer pressable flex min-h-12 min-w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-xs border px-3 py-1 text-label tabular-nums transition-colors duration-200',
              active ? 'border-primary bg-primary font-semibold text-on-primary' : 'border-outline bg-surface-container-lowest text-on-surface',
            )}
          >
            <span>{session.startTime}</span>
            {state && <span className={cn('text-label leading-tight', active ? 'text-on-ink-variant' : 'text-on-surface-variant')}>{state}</span>}
          </button>
        )
      })}
    </div>
  )
}
