// Server settings are named STC_* (STC_DEMO, STC_PORT, ...). The LAFU_* names from before the club was renamed are
// still read as a fallback, so a server configured earlier (the hosted demo's Vercel settings) keeps working until
// its settings are renamed.
export function setting(name: string): string | undefined {
  return process.env[`STC_${name}`] ?? process.env[`LAFU_${name}`]
}
