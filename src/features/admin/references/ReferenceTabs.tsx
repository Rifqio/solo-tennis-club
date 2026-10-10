import { NavLink, useLocation } from 'react-router-dom'
import type { ReferenceCounts, ReferenceKind } from '@shared/api/admin-references'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { useAdminResource } from '../forms/use-admin-resource'
import { referenceConfig } from './reference-config'

// The three setup lists as one switch on the band (board D9b): white for the open list, deep blue for the others,
// each with how many active records it holds. Counts refresh on every navigation, so a save or archive shows at once.
export function ReferenceTabs({ current }: { current: ReferenceKind }) {
  const { t } = useI18n()
  const location = useLocation()
  const counts = useAdminResource<ReferenceCounts>('/api/admin/reference-counts', location.key).data
  return (
    <nav aria-label={t({ id: 'Jenis data', en: 'Record type' })} className="grid grid-cols-3 gap-2">
      {(Object.keys(referenceConfig) as ReferenceKind[]).map(kind => {
        const active = kind === current
        return (
          <NavLink key={kind} to={`/admin/${referenceConfig[kind].path}`} replace viewTransition aria-current={active ? 'page' : undefined}
            className={cn('pressable flex min-h-12 items-center justify-center gap-2 rounded-full px-2 font-semibold lg:pl-[1.125rem] lg:pr-2',
              active ? 'bg-surface-container-lowest text-primary' : 'bg-band-tile text-on-signboard')}>
            {t(referenceConfig[kind].label)}
            {counts && <span className={cn('flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-label tabular-nums',
              active ? 'bg-primary text-on-primary' : 'bg-on-signboard/20 text-on-signboard')}>{counts[kind]}</span>}
          </NavLink>
        )
      })}
    </nav>
  )
}
