// Server settings are named STC_* (STC_DEMO, STC_PORT, STC_DATABASE_FILE, ...).
export function setting(name: string): string | undefined {
  return process.env[`STC_${name}`]
}
