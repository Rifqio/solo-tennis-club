import { Outlet, useLocation, useParams } from 'react-router-dom'
import { useMediaQuery } from '@/lib/use-media-query'
import { ReferenceDesktop } from './ReferenceDesktop'
import { referenceKindOf } from './reference-config'

// One route for all of Kelola. The band and its Coach / Lokasi / Level switch stay mounted while the admin changes
// tab or record, so only the switch's pill moves (DESIGN.md, Motion: a choice inside one view is instant). Desktop
// renders the split view here for every URL; phones render the list or the form screen below.
export function Component() {
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const { pathname } = useLocation()
  const { id } = useParams()
  if (!isDesktop) return <Outlet />
  return <ReferenceDesktop kind={referenceKindOf(pathname)} selected={pathname.endsWith('/new') ? 'new' : id ?? null} />
}
