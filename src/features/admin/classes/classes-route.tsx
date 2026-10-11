import { Outlet, useLocation, useParams } from 'react-router-dom'
import { useMediaQuery } from '@/lib/use-media-query'
import { ClassDesktop } from './ClassDesktop'

// One route for Kelas. On desktop the split view stays mounted while the admin picks another class or starts a new
// one, so the highlight glides and the search is kept; phones render the list or the form screen below.
export function Component() {
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const { pathname } = useLocation()
  const { id } = useParams()
  if (!isDesktop) return <Outlet />
  return <ClassDesktop selected={pathname.endsWith('/new') ? 'new' : id ?? null} />
}
