import type { RequestHandler } from 'express'
import type { RuntimeConfig } from '../../config/runtime-config.ts'
import type { AppConfigResponse } from '../../../shared/api/app-config.ts'

// What the browser may show on this server: the admin demo button, and whether this is the hosted demo.
export function createAppConfigController(config: RuntimeConfig) {
  const read: RequestHandler = (_request, response) => {
    const body: AppConfigResponse = { demo: Boolean(config.demo), adminShortcut: Boolean(config.developmentMode || config.demo) }
    response.set('Cache-Control', 'no-store').json(body)
  }
  return { read }
}
