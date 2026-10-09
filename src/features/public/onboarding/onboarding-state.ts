export const ONBOARDED_KEY = 'lafu.onboarded'

// TESTING ONLY: while true, onboarding shows on every load of the plain schedule, even after it was finished or
// skipped, so the team can review it. Set back to false before release (DESIGN.md: first visit only).
export const ONBOARDING_ALWAYS = true

// Shown when the visit starts on the plain schedule. A deep link (a date, a session, booking, sign-in, the club page)
// means the visitor already knows where they are going, so it is never interrupted.
export function shouldShowOnboarding(pathname: string, search: string, always = ONBOARDING_ALWAYS) {
  if (pathname !== '/' || search !== '') return false
  if (always) return true
  try { return window.localStorage.getItem(ONBOARDED_KEY) === null } catch { return false }
}

export function markOnboarded() {
  try { window.localStorage.setItem(ONBOARDED_KEY, '1') } catch { /* Private browsing: it may show again next visit, which is harmless. */ }
}
