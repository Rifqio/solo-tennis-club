import { addClubDays } from './club-time.ts'

export const PUBLIC_SCHEDULE_HORIZON_DAYS = 365

export function publicScheduleWindow(today: string) {
  return { minDate: today, maxDate: addClubDays(today, PUBLIC_SCHEDULE_HORIZON_DAYS) }
}
