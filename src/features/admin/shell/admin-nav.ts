import { BarChart3, CalendarDays, ListChecks, SlidersHorizontal, Ticket } from 'lucide-react'

// Left of the notch: today's work. Right: the setup screens.
export const adminNavLeading = [
  { to: '/admin/sessions', label: { id: 'Sesi', en: 'Sessions' }, Icon: CalendarDays, also: ['/admin'] },
  { to: '/admin/bookings', label: { id: 'Booking', en: 'Bookings' }, Icon: Ticket, also: [] },
]
export const adminNavTrailing = [
  { to: '/admin/recap', label: { id: 'Rekap', en: 'Recap' }, Icon: BarChart3, also: [] },
  // Rail only. On phones the dock keeps four destinations, so Kelas lives inside Kelola as a tab (board 19).
  { to: '/admin/classes', label: { id: 'Kelas', en: 'Classes' }, Icon: ListChecks, also: [], railOnly: true },
  // Straight to the first list: going through the /admin/manage redirect would show an empty step mid-transition.
  { to: '/admin/coaches', label: { id: 'Kelola', en: 'Manage' }, Icon: SlidersHorizontal, also: ['/admin/manage', '/admin/venues', '/admin/levels'], phoneAlso: ['/admin/classes'] },
]

// The dock shows on the tab screens and their lists; forms, the roster and booking details are focused tasks with
// their own bottom action, so it steps aside there.
export function isAdminTabScreen(pathname: string) {
  return /^\/admin(?:\/(?:sessions|bookings|recap|classes|manage|coaches|venues|levels))?\/?$/.test(pathname)
}
