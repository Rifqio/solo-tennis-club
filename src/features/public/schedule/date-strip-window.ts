import { addClubDays } from '@shared/club-time'

export const STRIP_LENGTH = 7

interface StripInput {
  selected: string
  currentStart: string | null
  minDate: string
  maxDate: string
}

// Keeps the current seven-day window while the selection stays inside it; otherwise starts the window at the selection,
// clamped so it never begins before minDate or runs past maxDate.
export function computeStripWindow({ selected, currentStart, minDate, maxDate }: StripInput): string[] {
  let start = currentStart !== null && currentStart <= selected && selected <= addClubDays(currentStart, STRIP_LENGTH - 1) ? currentStart : selected
  const latestStart = addClubDays(maxDate, -(STRIP_LENGTH - 1))
  if (start > latestStart) start = latestStart
  if (start < minDate) start = minDate
  return Array.from({ length: STRIP_LENGTH }, (_, index) => addClubDays(start, index))
}
