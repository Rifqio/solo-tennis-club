import { NavLink, useLocation } from 'react-router-dom'
import type { ReferenceCounts, ReferenceKind } from '@shared/api/admin-references'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/use-media-query'
import { useAdminResource } from '../forms/use-admin-resource'
import { referenceConfig } from './reference-config'
import { SelectionBase, SelectionMark } from '@/components/ui/selection-mark'

type SetupTab = ReferenceKind | 'classes'
const classesTab = { path: 'classes', label: { id: 'Kelas', en: 'Classes' } }

// The setup lists as one switch on the band (board D9b): white for the open list, deep blue for the others, each with
// how many active records it holds. Counts refresh on every navigation, so a save or archive shows at once.
// A tab is a choice inside Kelola, not a new page: the list swaps at once and only the white pill slides to it.
// Phones have no Kelas in the dock (board 19), so there Kelas joins as a fourth tab and the four sit in two rows.
export function ReferenceTabs({ current }: { current: SetupTab }) {
  const { t } = useI18n()
  const location = useLocation()
  const isPhone = useMediaQuery('(max-width: 39.99rem)')
  const counts = useAdminResource<ReferenceCounts>('/api/admin/reference-counts', location.key).data
  const tabs: SetupTab[] = [...(isPhone ? ['classes' as const] : []), ...(Object.keys(referenceConfig) as ReferenceKind[])]
  return (
    <nav aria-label={t({ id: 'Jenis data', en: 'Record type' })} className={cn('isolate grid gap-2', isPhone ? 'grid-cols-2' : 'grid-cols-3')}>
      {tabs.map(kind => {
        const active = kind === current
        const config = kind === 'classes' ? classesTab : referenceConfig[kind]
        return (
          <NavLink key={kind} to={`/admin/${config.path}`} replace aria-current={active ? 'page' : undefined}
            className={cn('selection-item pressable flex min-h-12 items-center justify-center gap-2 rounded-full px-2 font-semibold lg:pl-[1.125rem] lg:pr-2',
              active ? 'text-primary' : 'text-on-signboard')}>
            <SelectionBase className="rounded-full bg-band-tile" />
            {active && <SelectionMark layoutId="reference-tab" className="rounded-full bg-surface-container-lowest" />}
            {t(config.label)}
            {counts && <span className={cn('flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-label tabular-nums',
              active ? 'bg-primary text-on-primary' : 'bg-on-signboard/20 text-on-signboard')}>{counts[kind]}</span>}
          </NavLink>
        )
      })}
    </nav>
  )
}
