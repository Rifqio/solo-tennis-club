import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { ApiError } from '../../../http/errors.ts'
import { addClubMonths, clubDateOf, clubDayRange, clubMonthOf, clubMonthRange, lastClubDateOf } from '../../../../shared/club-time.ts'
import { DEADLINE_BOUND_STATUSES, STANDING_STATUSES } from '../../../../shared/booking-rules.ts'
import type { AdminRecapClassRow, AdminRecapResponse } from '../../../../shared/api/admin-recap.ts'
import { createRecapRepository, type RecapSession } from './recap.repository.ts'

const SIX_MONTHS = 6

// The same "holds its places" rule as capacity (activeBookingWhere), applied to rows already read.
function holdsPlaces(booking: RecapSession['bookings'][number], now: Date) {
  if ((STANDING_STATUSES as readonly string[]).includes(booking.status)) return true
  return (DEADLINE_BOUND_STATUSES as readonly string[]).includes(booking.status) && booking.originalDeadline > now
}

export interface RecapSummary {
  revenueIdr: number
  pending: { amountIdr: number; bookings: number }
  places: { used: number; capacity: number }
  sessions: { held: number; upcoming: number; cancelled: number }
  classes: AdminRecapClassRow[]
}

// The month in numbers, from its sessions (OPER-12).
// - Revenue: paid bookings of the month's sessions not cancelled, later sessions of a running month included.
// - Pending: unpaid or awaiting a corrected proof, still before the deadline, anywhere in the month.
// - Places: places held by active bookings against places offered, over the whole month's sessions not cancelled.
// - Sessions: held (already started), upcoming, cancelled.
export function summarizeRecap(sessions: RecapSession[], now: Date): RecapSummary {
  const summary: RecapSummary = { revenueIdr: 0, pending: { amountIdr: 0, bookings: 0 }, places: { used: 0, capacity: 0 }, sessions: { held: 0, upcoming: 0, cancelled: 0 }, classes: [] }
  const byClass = new Map<string, AdminRecapClassRow>()
  for (const session of sessions) {
    if (session.status === 'cancelled') { summary.sessions.cancelled += 1; continue }
    if (session.startsAt <= now) summary.sessions.held += 1
    else summary.sessions.upcoming += 1
    const row = byClass.get(session.class.id) ?? { id: session.class.id, name: session.class.name, sessions: 0, used: 0, capacity: 0, revenueIdr: 0 }
    byClass.set(session.class.id, row)
    row.sessions += 1
    row.capacity += session.maxParticipants
    summary.places.capacity += session.maxParticipants
    for (const booking of session.bookings) {
      if (!holdsPlaces(booking, now)) continue
      row.used += booking.quantity
      summary.places.used += booking.quantity
      if (booking.status === 'confirmed') {
        row.revenueIdr += booking.totalPriceIdr
        summary.revenueIdr += booking.totalPriceIdr
      } else if ((DEADLINE_BOUND_STATUSES as readonly string[]).includes(booking.status)) {
        summary.pending.amountIdr += booking.totalPriceIdr
        summary.pending.bookings += 1
      }
    }
  }
  summary.classes = [...byClass.values()].sort((a, b) => b.revenueIdr - a.revenueIdr || a.name.localeCompare(b.name))
  return summary
}

export function changePercent(current: number, previous: number) {
  return Math.round(((current - previous) / previous) * 100)
}

// What a month compares with. A finished month: the whole month before. A running month: how much of the month
// before had been paid by the same day of that month ("1-11 Sep"), a fair "ahead or behind" while money still comes in.
export function recapWindows(month: string, now: Date) {
  const latestMonth = clubMonthOf(now)
  const partial = month === latestMonth
  const today = clubDateOf(now)
  const previous = addClubMonths(month, -1)
  const lastOfPrevious = lastClubDateOf(previous)
  const previousTo = partial ? (`${previous}-${today.slice(8)}` < lastOfPrevious ? `${previous}-${today.slice(8)}` : lastOfPrevious) : lastOfPrevious
  return {
    latestMonth, partial,
    range: { from: `${month}-01`, to: lastClubDateOf(month) },
    comparison: {
      month: previous, from: `${previous}-01`, to: previousTo,
      start: clubMonthRange(previous).start, end: clubMonthRange(previous).end,
      paidBefore: partial ? clubDayRange(previousTo).end : undefined,
    },
  }
}

export async function getRecap(database: PrismaClient, month: string, now = new Date()): Promise<AdminRecapResponse & { sessionRows: RecapSession[] }> {
  if (month > clubMonthOf(now)) throw new ApiError(400, 'DATE_OUT_OF_RANGE')
  const repository = createRecapRepository(database)
  const windows = recapWindows(month, now)
  const { start, end } = clubMonthRange(month)
  const firstBar = addClubMonths(month, -(SIX_MONTHS - 1))
  const [sessionRows, comparisonPaid, barPaid] = await Promise.all([
    repository.sessionsBetween(start, end),
    repository.paidBookingsBetween(windows.comparison.start, windows.comparison.end, windows.comparison.paidBefore),
    repository.paidBookingsBetween(clubMonthRange(firstBar).start, start),
  ])
  const summary = summarizeRecap(sessionRows, now)
  const previousRevenue = comparisonPaid.reduce((sum, booking) => sum + booking.totalPriceIdr, 0)

  const months = Array.from({ length: SIX_MONTHS }, (_, index) => ({ month: addClubMonths(firstBar, index), revenueIdr: 0 }))
  for (const booking of barPaid) {
    const bar = months.find(entry => entry.month === clubMonthOf(booking.session.startsAt))
    if (bar) bar.revenueIdr += booking.totalPriceIdr
  }
  months[SIX_MONTHS - 1].revenueIdr = summary.revenueIdr

  const { month: comparisonMonth, from, to } = windows.comparison
  const comparisonDates = { month: comparisonMonth, from, to }
  return {
    month, partial: windows.partial, range: windows.range, latestMonth: windows.latestMonth,
    revenueIdr: summary.revenueIdr,
    comparison: previousRevenue > 0 ? { ...comparisonDates, revenueIdr: previousRevenue, changePct: changePercent(summary.revenueIdr, previousRevenue) } : null,
    pending: summary.pending, places: summary.places, sessions: summary.sessions,
    months, classes: summary.classes,
    sessionRows,
  }
}
