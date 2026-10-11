export const CLUB_TIME_ZONE = 'Asia/Jakarta'
const OFFSET_MS = 420 * 60_000
export function isClubDate(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(date + 'T00:00:00.000Z')
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}
export function clubDateOf(instant: Date | string): string {
  return new Date(new Date(instant).getTime() + OFFSET_MS).toISOString().slice(0, 10)
}
export function clubDayRange(date: string) {
  if (!isClubDate(date)) throw new RangeError('Invalid club date')
  const start = new Date(date + 'T00:00:00+07:00')
  return { start, end: new Date(start.getTime() + 86_400_000) }
}
export function clubToday(now = new Date()) { return clubDateOf(now) }
export function addClubDays(date: string, count: number) {
  if (!Number.isInteger(count)) throw new RangeError('Day count must be an integer')
  return clubDateOf(new Date(clubDayRange(date).start.getTime() + count * 86_400_000))
}
// Club months as "YYYY-MM" (Rekap). A month runs from its first club midnight to the next month's.
export function isClubMonth(month: unknown): month is string {
  return typeof month === 'string' && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(month)
}
export function clubMonthOf(instant: Date | string): string { return clubDateOf(instant).slice(0, 7) }
export function addClubMonths(month: string, count: number): string {
  if (!isClubMonth(month) || !Number.isInteger(count)) throw new RangeError('Invalid club month')
  const index = Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1 + count
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${String(index % 12 + 1).padStart(2, '0')}`
}
export function clubMonthRange(month: string) {
  if (!isClubMonth(month)) throw new RangeError('Invalid club month')
  return { start: clubDayRange(`${month}-01`).start, end: clubDayRange(`${addClubMonths(month, 1)}-01`).start }
}
export function lastClubDateOf(month: string) { return addClubDays(`${addClubMonths(month, 1)}-01`, -1) }
export function clubDateTimeToInstant(date: string, time: string): Date {
  if (!isClubDate(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new RangeError('Invalid club date or time')
  return new Date(date + 'T' + time + ':00+07:00')
}
export function clubTimeOf(instant: Date | string): string {
  return new Date(new Date(instant).getTime() + OFFSET_MS).toISOString().slice(11, 16)
}
