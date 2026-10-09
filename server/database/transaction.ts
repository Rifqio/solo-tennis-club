import type { PrismaClient, Prisma } from '../generated/prisma/client.ts'

export type Database = PrismaClient | Prisma.TransactionClient

export function inTransaction<T>(
  database: PrismaClient,
  work: (transaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return database.$transaction(work)
}

export function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

export class DatabaseBusyError extends Error {
  constructor() {
    super('Database write could not acquire a lock')
  }
}

function isTransientWriteConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error
    && (error.code === 'P1008' || error.code === 'P2034')
}

export async function inWriteTransaction<T>(
  database: PrismaClient,
  work: (transaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await inTransaction(database, work)
    } catch (error) {
      if (!isTransientWriteConflict(error)) throw error
      if (attempt === 2) throw new DatabaseBusyError()
      await new Promise(resolve => setTimeout(resolve, 20 * 2 ** attempt))
    }
  }
  throw new DatabaseBusyError()
}
