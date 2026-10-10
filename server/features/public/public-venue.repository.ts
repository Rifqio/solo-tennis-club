import type { Database } from '../../database/transaction.ts'

export function createPublicVenueRepository(database: Database) {
  return {
    listAll() {
      return database.venue.findMany({
        select: { id: true, name: true, address: true, mapUrl: true, isSample: true },
        orderBy: [{ nameKey: 'asc' }, { id: 'asc' }],
      })
    },
  }
}
