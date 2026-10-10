import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Archive } from 'lucide-react'
import type { ReferenceKind, ReferenceRecord } from '@shared/api/admin-references'
import { StatusPanel } from '@/components/ui/status-panel'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { useI18n } from '@/i18n/use-i18n'
import { useAdminAuth } from '../auth/use-admin-auth'
import { adminMessages as messages } from '../forms/admin.messages'
import { referenceConfig } from './reference-config'

const copy = {
  archived: { id: '{name} diarsipkan', en: '{name} archived' },
  archivedBody: { id: 'Kelas yang sudah memakainya tetap memakainya.', en: 'Classes that already use it keep it.' },
  undo: { id: 'Urungkan', en: 'Undo' },
  showArchive: { id: 'Lihat arsip', en: 'View archive' },
  showActive: { id: 'Kembali ke daftar aktif', en: 'Back to the active list' },
  archiveTitle: { id: 'Arsip', en: 'Archive' },
}

// After archiving: what happened, and an undo that restores it against the version the archive returned.
export function ArchivedNotice({ kind }: { kind: ReferenceKind }) {
  const { t } = useI18n()
  const { send } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [failure, setFailure] = useState<string | null>(null)
  const archived = (location.state as { archived?: ReferenceRecord } | null)?.archived
  if (!archived) return null
  const undo = async () => {
    const result = await send<ReferenceRecord>('POST', `/api/admin/${referenceConfig[kind].path}/${archived.id}/restore`, { version: archived.version })
    if (result.kind === 'ok') navigate(`/admin/${referenceConfig[kind].path}/${archived.id}/edit`, { replace: true, state: { savedId: archived.id } })
    else setFailure(t(result.kind === 'http' ? apiErrorMessages[result.code] ?? apiErrorMessages.INTERNAL : messages.saveError))
  }
  return (
    <StatusPanel tone={failure ? 'error' : 'success'} title={failure ?? t(copy.archived, { name: archived.name })} action={{ label: t(copy.undo), onAction: () => void undo() }}>
      {!failure && <p>{t(copy.archivedBody)}</p>}
    </StatusPanel>
  )
}

// Switches the list between active records and the archive; the choice lives in the URL so opening a row keeps it.
export function ArchiveToggle({ kind, archive }: { kind: ReferenceKind; archive: boolean }) {
  const { t } = useI18n()
  const path = `/admin/${referenceConfig[kind].path}`
  return (
    <Link to={archive ? path : `${path}?view=archive`} replace
      className="state-layer flex min-h-12 items-center justify-center gap-2 self-center rounded-sm px-3 text-label font-semibold text-primary">
      <Archive aria-hidden="true" className="size-4" />{t(archive ? copy.showActive : copy.showArchive)}
    </Link>
  )
}

// Heading words for the archive view of a list.
export function ArchiveHeading({ kind }: { kind: ReferenceKind }) {
  const { t } = useI18n()
  return <>{t(copy.archiveTitle)} · {t(referenceConfig[kind].label)}</>
}
