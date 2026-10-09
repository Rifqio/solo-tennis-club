export const ONBOARDED_KEY = 'lafu.onboarded'

// Shown once per device, only when the visit starts on the plain schedule. A deep link (a date, a session, booking,
// sign-in, the club page) means the visitor already knows where they are going, so it is never interrupted.
export function shouldShowOnboarding(pathname: string, search: string) {
  if (pathname !== '/' || search !== '') return false
  try { return window.localStorage.getItem(ONBOARDED_KEY) === null } catch { return false }
}

export function markOnboarded() {
  try { window.localStorage.setItem(ONBOARDED_KEY, '1') } catch { /* Private browsing: it may show again next visit, which is harmless. */ }
}
