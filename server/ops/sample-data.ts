import type { PrismaClient } from '../generated/prisma/client.ts'
import { addClubDays, clubDateTimeToInstant, clubToday } from '../../shared/club-time.ts'

// Development-only sample catalog. Every record is isSample and the screens show the sample-data notice beside them.
// Levels, venues and classes start with "Contoh" (Indonesian for "example"); coaches carry plain names, at the club
// owner's request (2026-10-10), so the coach cards read naturally. No club facts, no bookings, no occupancy.
const LEVELS = ['Contoh Level Pemula', 'Contoh Level Menengah']
const VENUES = ['Contoh Lapangan 1', 'Contoh Lapangan 2 Indoor']
const COACHES = ['Pelatih A', 'Pelatih B', 'Pelatih C']
const CLASSES = [
  { name: 'Contoh Kelas Dasar', level: 0, venue: 0, duration: 90, price: 120000, min: 4, max: 8, coaches: [0] },
  // Long name on purpose, to review wrapping on small phones; two default coaches and an odd capacity.
  { name: 'Contoh Kelas Drill Forehand dan Backhand untuk Pemain Menengah', level: 1, venue: 1, duration: 120, price: 175000, min: 3, max: 7, coaches: [1, 2] },
  { name: 'Contoh Kelas Pagi', level: 0, venue: 1, duration: 60, price: 100000, min: 2, max: 6, coaches: [2] },
]

// [day offset from today, start time WIB, class index, cancelled?]. Days 3, 7, and 10 stay empty so the
// "next scheduled date" shortcut can be reviewed; day 2 and day 9 each carry one cancelled session.
const SESSIONS: Array<[number, string, number, boolean?]> = [
  [0, '06:30', 2], [0, '16:00', 1], [0, '19:30', 0],
  [1, '07:00', 0], [1, '18:00', 1],
  [2, '06:00', 2], [2, '18:30', 0, true],
  [4, '06:30', 2], [4, '08:00', 1], [4, '17:00', 0],
  [5, '16:30', 1],
  [6, '07:30', 0], [6, '09:00', 2], [6, '19:00', 1],
  [8, '06:30', 2], [8, '18:00', 0],
  [9, '07:00', 1], [9, '19:30', 0, true],
  [11, '16:00', 0], [11, '18:00', 1],
  [12, '06:30', 2],
  [13, '08:00', 0], [13, '10:00', 1],
]

// The sample coaches from board D10, with portraits copied from the design canvas (public/photos/coaches/*.json).
// Two have no photo on purpose, so the picker's initials fallback is visible.
const SAMPLE_COACHES: Array<[string, string | null]> = [
  ['Budi Santoso', '/photos/coaches/budi.webp'], ['Rina Wulandari', '/photos/coaches/rina.webp'],
  ['Dewi Lestari', '/photos/coaches/dewi.webp'], ['Agus Pratama', '/photos/coaches/agus.webp'],
  ['Yoga Saputra', '/photos/coaches/yoga.webp'], ['Hendra Wijaya', '/photos/coaches/hendra.webp'],
  ['Fajar Nugroho', '/photos/coaches/fajar.webp'], ['Maya Anggraini', '/photos/coaches/maya.webp'],
  ['Sari Puspita', null], ['Rizky Hidayat', null],
]

const key = (name: string) => name.toLowerCase()

// Renames legacy "Contoh" sample coaches, adds the sample coaches and fills a missing portrait; a coach the admin
// already gave a photo keeps it. Returns how many coaches it created or updated.
export async function seedSampleCoaches(prisma: PrismaClient) {
  let changed = 0
  // Sample coaches seeded before 2026-10-10 were named "Contoh <name>"; drop the prefix where the plain name is free.
  for (const name of [...COACHES, ...SAMPLE_COACHES.map(([coach]) => coach)]) {
    const legacy = await prisma.coach.findUnique({ where: { nameKey: key('Contoh ' + name) } })
    if (legacy?.isSample && !(await prisma.coach.findUnique({ where: { nameKey: key(name) } }))) {
      await prisma.coach.update({ where: { id: legacy.id }, data: { name, nameKey: key(name), version: { increment: 1 } } })
      changed++
    }
  }
  for (const [name, photoUrl] of SAMPLE_COACHES) {
    const existing = await prisma.coach.findUnique({ where: { nameKey: key(name) } })
    if (!existing) { await prisma.coach.create({ data: { name, nameKey: key(name), photoUrl, isSample: true } }); changed++ }
    else if (!existing.photoUrl && photoUrl) { await prisma.coach.update({ where: { id: existing.id }, data: { photoUrl } }); changed++ }
  }
  return changed
}

export type SeedOutcome = 'created' | 'skipped' | 'refreshed'

// Repeat-safe: a second run changes nothing. With refresh, the sample sessions are re-dated from today
// (sample catalog kept) so a long-lived development database never runs out of upcoming sample sessions.
export async function seedSampleData(prisma: PrismaClient, { now = new Date(), refresh = false } = {}): Promise<SeedOutcome> {
  const existing = await prisma.tennisClass.findMany({ where: { isSample: true, nameKey: { in: CLASSES.map(item => key(item.name)) } }, include: { defaultCoaches: { orderBy: { position: 'asc' } } } })
  if (existing.length === CLASSES.length && !refresh) return 'skipped'

  return prisma.$transaction(async tx => {
    let classes = existing
    if (classes.length !== CLASSES.length) {
      const levels = await Promise.all(LEVELS.map(name => tx.level.upsert({ where: { nameKey: key(name) }, update: {}, create: { name, nameKey: key(name), isSample: true } })))
      const venues = await Promise.all(VENUES.map(name => tx.venue.upsert({ where: { nameKey: key(name) }, update: {}, create: { name, nameKey: key(name), isSample: true } })))
      const coaches = await Promise.all(COACHES.map(name => tx.coach.upsert({ where: { nameKey: key(name) }, update: {}, create: { name, nameKey: key(name), isSample: true } })))
      classes = []
      for (const item of CLASSES) {
        classes.push(await tx.tennisClass.upsert({
          where: { nameKey: key(item.name) },
          update: {},
          create: {
            name: item.name, nameKey: key(item.name), isSample: true,
            defaultLevelId: levels[item.level].id, defaultVenueId: venues[item.venue].id,
            defaultDurationMinutes: item.duration, defaultPriceIdr: item.price,
            defaultMinParticipants: item.min, defaultMaxParticipants: item.max,
            defaultCoaches: { create: item.coaches.map((coachIndex, position) => ({ coachId: coaches[coachIndex].id, position })) },
          },
          include: { defaultCoaches: { orderBy: { position: 'asc' } } },
        }))
      }
    }

    const classIds = classes.map(item => item.id)
    const hadSessions = await tx.classSession.count({ where: { isSample: true, classId: { in: classIds } } })
    if (hadSessions) await tx.classSession.deleteMany({ where: { isSample: true, classId: { in: classIds } } })

    const today = clubToday(now)
    for (const [offset, time, classIndex, cancelled] of SESSIONS) {
      const sample = classes[classIndex]
      await tx.classSession.create({ data: {
        classId: sample.id, levelId: sample.defaultLevelId, venueId: sample.defaultVenueId,
        startsAt: clubDateTimeToInstant(addClubDays(today, offset), time),
        durationMinutes: sample.defaultDurationMinutes, priceIdr: sample.defaultPriceIdr,
        minParticipants: sample.defaultMinParticipants, maxParticipants: sample.defaultMaxParticipants,
        status: cancelled ? 'cancelled' : 'scheduled', isSample: true,
        coaches: { create: sample.defaultCoaches.map(link => ({ coachId: link.coachId, position: link.position })) },
      } })
    }
    return hadSessions ? 'refreshed' : 'created'
  })
}

export const SAMPLE_SESSION_COUNT = SESSIONS.length
export const SAMPLE_COACH_COUNT = COACHES.length + SAMPLE_COACHES.length
