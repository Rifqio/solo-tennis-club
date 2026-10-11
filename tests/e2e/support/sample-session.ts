import { addClubDays, clubDateTimeToInstant, clubToday } from '../../../shared/club-time.ts'

// The e2e server's sample session is tomorrow at 18:00 WIB, so it is still open whatever time of day the suite runs
// (today 18:00 read "Selesai" for runs after six in the evening). Specs open the schedule on this date.
export const SAMPLE_SESSION_DATE = addClubDays(clubToday(), 1)
export const SAMPLE_SESSION_STARTS_AT = clubDateTimeToInstant(SAMPLE_SESSION_DATE, '18:00')
export const sampleSchedulePath = `/schedule?date=${SAMPLE_SESSION_DATE}`
