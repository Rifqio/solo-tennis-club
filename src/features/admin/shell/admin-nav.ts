import { CalendarDays, ListChecks, SlidersHorizontal, Ticket } from 'lucide-react'

// Left of the notch: today's work. Right: the setup screens.
export const adminNavLeading = [
  { to: '/admin/sessions', label: { id: 'Sesi', en: 'Sessions' }, Icon: CalendarDays, also: ['/admin'] },
  { to: '/admin/bookings', label: { id: 'Booking', en: 'Bookings' }, Icon: Ticket, also: [] },
]
export const adminNavTrailing = [
  { to: '/admin/classes', label: { id: 'Kelas', en: 'Classes' }, Icon: ListChecks, also: [] },
  { to: '/admin/manage', label: { id: 'Kelola', en: 'Manage' }, Icon: SlidersHorizontal, also: ['/admin/coaches', '/admin/venues', '/admin/levels'] },
]

// The dock shows on the tab screens and their lists; forms, the roster and booking details are focused tasks with
// their own bottom action, so it steps aside there.
export function isAdminTabScreen(pathname: string) {
  return /^\/admin(?:\/(?:sessions|bookings|classes|manage|coaches|venues|levels))?\/?$/.test(pathname)
}
