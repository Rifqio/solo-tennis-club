import type { ClientErrorReport } from '../../../shared/api/client-errors.ts'

const WINDOW_MS = 60_000
const REPORTS_PER_WINDOW = 20

// Writes a 500-page report to the server log, so the code a member reads out can be found. A visitor can send at most
// a few reports a minute; the rest are dropped quietly (the page shows the same code either way).
export function createClientErrorService({ log = (line: string) => console.warn(line), now = () => Date.now() } = {}) {
  const recent = new Map<string, number[]>()

  function withinLimit(visitor: string) {
    const cutoff = now() - WINDOW_MS
    const times = (recent.get(visitor) ?? []).filter(time => time > cutoff)
    if (times.length >= REPORTS_PER_WINDOW) {
      recent.set(visitor, times)
      return false
    }
    times.push(now())
    recent.set(visitor, times)
    return true
  }

  function record(report: ClientErrorReport, visitor: string) {
    if (!withinLimit(visitor)) return false
    log(`Client error ${report.code} [${report.kind}] on ${report.path}: ${report.message}`)
    return true
  }

  return { record }
}
