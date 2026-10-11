import { Outlet, useParams } from 'react-router-dom'
import { useMediaQuery } from '@/lib/use-media-query'
import { AdminBookingsDesktop } from './AdminBookingsDesktop'

// One route for Booking masuk. On desktop the table and its drawer stay mounted while the admin opens, switches and
// closes bookings, so the drawer slides in once and the row highlight glides; phones render the list or the booking.
export function Component() {
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const { id } = useParams()
  if (!isDesktop) return <Outlet />
  return <AdminBookingsDesktop openId={id ?? null} />
}
