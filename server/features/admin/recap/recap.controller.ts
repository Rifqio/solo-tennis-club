import type { RequestHandler } from 'express'
import { z } from 'zod'
import type { PrismaClient } from '../../../generated/prisma/client.ts'
import { ApiError } from '../../../http/errors.ts'
import { isClubMonth } from '../../../../shared/club-time.ts'
import { getRecap } from './recap.service.ts'
import { buildRecapWorkbook, recapFileName } from './recap-export.ts'

const query = z.object({ month: z.string().refine(isClubMonth) })

function monthOf(value: unknown) {
  const parsed = query.safeParse(value)
  if (!parsed.success) throw new ApiError(400, 'VALIDATION_FAILED', { month: 'INVALID_FORMAT' })
  return parsed.data.month
}

export function createRecapController(database: PrismaClient) {
  const show: RequestHandler = async (request, response) => {
    const { sessionRows: _rows, ...recap } = await getRecap(database, monthOf(request.query))
    void _rows
    response.json(recap)
  }
  const exportWorkbook: RequestHandler = async (request, response) => {
    const month = monthOf(request.query)
    const { sessionRows, ...recap } = await getRecap(database, month)
    const file = await buildRecapWorkbook(recap, sessionRows)
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.setHeader('Content-Disposition', `attachment; filename="${recapFileName(month)}"`)
    response.send(file)
  }
  return { show, exportWorkbook }
}
