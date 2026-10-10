import { NavLink } from 'react-router-dom'
import type { ReferenceKind } from '@shared/api/admin-references'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { referenceConfig } from './reference-config'

// The three setup lists as one switch on the band: white for the open list, blue for the others.
export function ReferenceTabs({ current }: { current: ReferenceKind }) {
  const { t } = useI18n()
  return (
    <nav aria-label={t({ id: 'Jenis data', en: 'Record type' })} className="grid grid-cols-3 gap-1 rounded-sm bg-band-tile p-1">
      {(Object.keys(referenceConfig) as ReferenceKind[]).map(kind => (
        <NavLink key={kind} to={`/admin/${referenceConfig[kind].path}`} replace viewTransition aria-current={kind === current ? 'page' : undefined}
          className={cn('pressable flex min-h-12 items-center justify-center rounded-xs px-2 text-label font-semibold',
            kind === current ? 'bg-surface-container-lowest text-on-surface' : 'text-on-signboard')}>
          {t(referenceConfig[kind].label)}
        </NavLink>
      ))}
    </nav>
  )
}
