import { randomUUID } from 'node:crypto'
import type { PrismaClient } from '../../server/generated/prisma/client.ts'
import { clubDateTimeToInstant, clubToday } from '../../shared/club-time.ts'

export async function createSampleCatalog(prisma: PrismaClient) {
  const suffix = randomUUID().slice(0, 8)
  const named = (name: string) => ({ name: name + ' ' + suffix, nameKey: (name + ' ' + suffix).toLowerCase(), isSample: true })
  const level = await prisma.level.create({ data: named('Sample beginner') })
  const venue = await prisma.venue.create({ data: named('Sample court') })
  const coaches = await Promise.all(['Sample coach one', 'Sample coach two'].map(name => prisma.coach.create({ data: named(name) })))
  const tennisClass = await prisma.tennisClass.create({ data: {
    ...named('Sample tennis class'), defaultLevelId: level.id, defaultVenueId: venue.id,
    defaultDurationMinutes: 90, defaultPriceIdr: 150000, defaultMinParticipants: 4, defaultMaxParticipants: 8,
    defaultCoaches: { create: coaches.map((coach, position) => ({ coachId: coach.id, position })) },
  } })
  return { level, venue, coaches, tennisClass }
}

export async function createSampleSession(prisma: PrismaClient, input: {
  catalog: Awaited<ReturnType<typeof createSampleCatalog>>; startsAt?: Date; durationMinutes?: number;
  priceIdr?: number; minParticipants?: number; maxParticipants?: number; status?: string;
}) {
  const { catalog } = input
  return prisma.classSession.create({ data: {
    classId: catalog.tennisClass.id, levelId: catalog.level.id, venueId: catalog.venue.id,
    startsAt: input.startsAt ?? clubDateTimeToInstant(clubToday(), '18:00'), durationMinutes: input.durationMinutes ?? 90,
    priceIdr: input.priceIdr ?? 150000, minParticipants: input.minParticipants ?? 4,
    maxParticipants: input.maxParticipants ?? 8, status: input.status ?? 'scheduled', isSample: true,
    coaches: { create: catalog.coaches.map((coach, position) => ({ coachId: coach.id, position })) },
  } })
}
