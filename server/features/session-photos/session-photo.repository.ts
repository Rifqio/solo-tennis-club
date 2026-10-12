import type { Prisma } from '../../generated/prisma/client.ts'
import type { Database } from '../../database/transaction.ts'

export const albumSessionFields = {
  id: true,
  startsAt: true,
  durationMinutes: true,
  status: true,
  isSample: true,
  class: { select: { name: true } },
  level: { select: { name: true } },
  venue: { select: { name: true } },
} satisfies Prisma.ClassSessionSelect

export type AlbumSessionRow = Prisma.ClassSessionGetPayload<{ select: typeof albumSessionFields }>

const photoFields = { id: true, url: true, width: true, height: true, isCover: true, createdAt: true } satisfies Prisma.SessionPhotoSelect
export type SessionPhotoRow = Prisma.SessionPhotoGetPayload<{ select: typeof photoFields }>

// Shown photos only: one waiting for Urungkan has deletedAt set.
const shown = { deletedAt: null } satisfies Prisma.SessionPhotoWhereInput

export function createSessionPhotoRepository(database: Database) {
  return {
    findSession(id: string) {
      return database.classSession.findUnique({ where: { id }, select: albumSessionFields })
    },
    listPhotos(sessionId: string) {
      return database.sessionPhoto.findMany({ where: { sessionId, ...shown }, select: photoFields, orderBy: [{ position: 'asc' }, { id: 'asc' }] })
    },
    countPhotos(sessionId: string) {
      return database.sessionPhoto.count({ where: { sessionId, ...shown } })
    },
    async nextPosition(sessionId: string) {
      const last = await database.sessionPhoto.findFirst({ where: { sessionId }, orderBy: { position: 'desc' }, select: { position: true } })
      return (last?.position ?? -1) + 1
    },
    createPhoto(data: { sessionId: string; url: string; width: number; height: number; byteSize: number; position: number; uploadedById: string | null }) {
      return database.sessionPhoto.create({ data, select: photoFields })
    },
    // Only this session's photos are touched, whatever ids arrive.
    markDeleted(sessionId: string, ids: string[], now: Date) {
      return database.sessionPhoto.updateMany({ where: { sessionId, id: { in: ids }, ...shown }, data: { deletedAt: now, isCover: false } })
    },
    restore(sessionId: string, ids: string[], since: Date) {
      return database.sessionPhoto.updateMany({ where: { sessionId, id: { in: ids }, deletedAt: { gte: since } }, data: { deletedAt: null } })
    },
    async setCover(sessionId: string, photoId: string) {
      await database.sessionPhoto.updateMany({ where: { sessionId, isCover: true }, data: { isCover: false } })
      return database.sessionPhoto.updateMany({ where: { sessionId, id: photoId, ...shown }, data: { isCover: true } })
    },
    // Photos deleted before `before` are past Urungkan: their rows go, and the caller removes their files.
    async purgeDeleted(before: Date) {
      const rows = await database.sessionPhoto.findMany({ where: { deletedAt: { lt: before } }, select: { id: true, url: true } })
      if (rows.length) await database.sessionPhoto.deleteMany({ where: { id: { in: rows.map(row => row.id) } } })
      return rows
    },
    // Albums with at least one photo, newest session first, for sessions that were not cancelled.
    async listRecentAlbums(limit: number) {
      const groups = await database.sessionPhoto.groupBy({
        by: ['sessionId'], where: { ...shown, session: { status: 'scheduled' } },
        _count: { _all: true }, _max: { createdAt: true },
      })
      if (!groups.length) return []
      const sessions = await database.classSession.findMany({
        where: { id: { in: groups.map(group => group.sessionId) } }, select: albumSessionFields,
        orderBy: [{ startsAt: 'desc' }, { id: 'asc' }], take: limit,
      })
      const covers = await database.sessionPhoto.findMany({
        where: { sessionId: { in: sessions.map(session => session.id) }, ...shown },
        select: { ...photoFields, sessionId: true }, orderBy: [{ isCover: 'desc' }, { position: 'asc' }, { id: 'asc' }],
      })
      const counts = new Map(groups.map(group => [group.sessionId, group._count._all]))
      return sessions.map(session => ({ session, count: counts.get(session.id) ?? 0, cover: covers.find(photo => photo.sessionId === session.id)! }))
    },
    // The newest session that ended inside the window, ran (not cancelled), and has no photos yet.
    findSessionWithoutPhotos(from: Date, now: Date) {
      return database.classSession.findMany({
        where: { status: 'scheduled', startsAt: { gte: from, lt: now }, photos: { none: shown } },
        select: albumSessionFields, orderBy: { startsAt: 'desc' }, take: 5,
      })
    },
  }
}
