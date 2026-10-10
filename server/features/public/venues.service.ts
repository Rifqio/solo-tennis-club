import type { Database } from '../../database/transaction.ts'
import type { PublicVenuesResponse } from '../../../shared/api/public.ts'
import { createPublicVenueRepository } from './public-venue.repository.ts'

export async function listPublicVenues(database: Database): Promise<PublicVenuesResponse> {
  return { venues: await createPublicVenueRepository(database).listAll() }
}
