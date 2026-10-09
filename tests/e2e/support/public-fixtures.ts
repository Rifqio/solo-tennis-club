import type { PublicSessionDetail, PublicScheduleResponse } from '../../../shared/api/public.ts'
import { addClubDays, clubDateTimeToInstant, clubToday } from '../../../shared/club-time.ts'
export const fixtureDate = addClubDays(clubToday(), 100)
export function publicFixture(id = 'samplefixture', patch: Partial<PublicSessionDetail> = {}): PublicSessionDetail {
  const startsAt = clubDateTimeToInstant(fixtureDate, '18:00')
  return { id, version: 1, date: fixtureDate, startsAt: startsAt.toISOString(), endsAt: new Date(startsAt.getTime() + 90 * 60000).toISOString(), startTime: '18:00', endTime: '19:30',
    className: 'Contoh kelas ' + id, levelName: 'Contoh pemula', venueName: 'Contoh lapangan', priceIdr: 150000, remainingPlaces: 8, availability: 'available', isSample: true,
    durationMinutes: 90, minParticipants: 2, maxParticipants: 8, coaches: ['Contoh pelatih satu','Contoh pelatih dua'], ...patch }
}
export function scheduleFixture(sessions: PublicSessionDetail[], patch: Partial<PublicScheduleResponse> = {}): PublicScheduleResponse {
  return { date: fixtureDate, today: clubToday(), timeZone: 'Asia/Jakarta', minDate: clubToday(), maxDate: addClubDays(clubToday(),365), nextDate: null, sessions, ...patch }
}
