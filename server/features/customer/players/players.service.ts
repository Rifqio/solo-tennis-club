import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { inTransaction } from '../../../database/transaction.ts'
import { clubDayRange } from '../../../../shared/club-time.ts'
import type { SessionPlayersResponse } from '../../../../shared/api/customer-players.ts'
import { createPlayersRepository } from './players.repository.ts'

// Who is playing in each session of one club day, for signed-in members (club owner decision, 2026-10-09:
// members see each other's names, as they did in the shared spreadsheet; visitors who are not signed in do not).
export async function getSessionPlayers(database: PrismaClient, date: string, now = new Date()): Promise<SessionPlayersResponse> {
  const { start, end } = clubDayRange(date)
  const rows = await inTransaction(database, transaction => createPlayersRepository(transaction).listActivePlayerNames(start, end, now))
  const sessions: Record<string, string[]> = {}
  for (const row of rows) {
    const names = sessions[row.booking.sessionId] ?? []
    names.push(row.name)
    sessions[row.booking.sessionId] = names
  }
  return { date, sessions }
}
