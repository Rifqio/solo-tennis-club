import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { referenceConfig } from '../references/reference-config'
import { adminMessages } from '../forms/admin.messages'
export function ManagePage() {
  const { t } = useI18n()
  return <div className="page-gutter mx-auto flex max-w-[50rem] flex-col gap-6 py-6"><h1 className="text-headline font-bold">{t(adminMessages.manage)}</h1>
    <p className="text-on-surface-variant">{t({ id: 'Siapkan coach, lokasi, dan level untuk kelas dan sesi klub.', en: 'Set up coaches, venues, and levels for club classes and sessions.' })}</p>
    <ul className="divide-y divide-outline-variant">{Object.values(referenceConfig).map(config => <li key={config.path}><Link className="state-layer flex min-h-16 items-center justify-between gap-4 rounded-sm px-3 py-4 font-bold" to={`/admin/${config.path}`}>{t(config.label)}<ChevronRight className="size-5 shrink-0" aria-hidden="true" /></Link></li>)}</ul>
  </div>
}
export const Component = ManagePage
