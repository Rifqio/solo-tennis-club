import { CalendarDays, ListChecks, Settings } from 'lucide-react'

export const adminNavItems = [
  { to: '/admin/sessions', label: { id: 'Sesi', en: 'Sessions' }, Icon: CalendarDays },
  { to: '/admin/classes', label: { id: 'Kelas', en: 'Classes' }, Icon: ListChecks },
  { to: '/admin/manage', label: { id: 'Kelola', en: 'Manage' }, Icon: Settings },
]
