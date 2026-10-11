import type { ClientErrorKind, ClientErrorReport } from '@shared/api/client-errors'

// "STC-7F3A-21": short enough to read out over WhatsApp, distinct enough to find in the server log.
export function makeReportCode(random: () => number = Math.random) {
  const hex = Math.floor(random() * 0x10000).toString(16).toUpperCase().padStart(4, '0')
  const digits = String(Math.floor(random() * 100)).padStart(2, '0')
  return `STC-${hex}-${digits}`
}

// A deploy replaces the code chunks; an open tab that asks for an old one fails to load it. Reloading fixes that.
export function isChunkLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(message)
}

export function describeError(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`.slice(0, 500)
  return String(error).slice(0, 500)
}

// Best effort: the 500 page shows its code whether or not this reaches the server.
export function reportClientError(code: string, kind: ClientErrorKind, error: unknown, path = window.location.pathname) {
  const report: ClientErrorReport = { code, kind, path: path.slice(0, 300), message: describeError(error) }
  void fetch('/api/client-errors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report), keepalive: true }).catch(() => {})
}
