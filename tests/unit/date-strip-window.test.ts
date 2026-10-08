import { describe, expect, it } from 'vitest'
import { computeStripWindow } from '@/features/public/schedule/date-strip-window'

const minDate = '2026-10-08'
const maxDate = '2027-10-08'

describe('computeStripWindow', () => {
  it('starts at today when today is selected', () => {
    const dates = computeStripWindow({ selected: minDate, currentStart: null, minDate, maxDate })
    expect(dates).toEqual(['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'])
  })

  it('keeps the window while the selection stays inside it', () => {
    expect(computeStripWindow({ selected: '2026-10-12', currentStart: minDate, minDate, maxDate })[0]).toBe(minDate)
  })

  it('moves the window to a selection beyond it', () => {
    expect(computeStripWindow({ selected: '2026-10-15', currentStart: minDate, minDate, maxDate })[0]).toBe('2026-10-15')
  })

  it('never ends after maxDate and always has seven dates', () => {
    const dates = computeStripWindow({ selected: maxDate, currentStart: null, minDate, maxDate })
    expect(dates).toHaveLength(7)
    expect(dates.at(-1)).toBe(maxDate)
    expect(dates[0]).toBe('2027-10-02')
  })

  it('never starts before minDate', () => {
    expect(computeStripWindow({ selected: minDate, currentStart: '2026-10-01', minDate, maxDate })[0]).toBe(minDate)
  })

  it('crosses month and year boundaries by club date', () => {
    const dates = computeStripWindow({ selected: '2026-12-29', currentStart: null, minDate, maxDate })
    expect(dates).toEqual(['2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04'])
  })
})
