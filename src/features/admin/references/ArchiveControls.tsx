import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Archive } from 'lucide-react'
import type { ReferenceKind } from '@shared/api/admin-references'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { referenceConfig } from './reference-config'
import { archiveCopy, useRestore } from './use-archive-toast'
import type { UndoFailure } from './use-archive-toast'

const copy = {
  showArchive: { id: 'Lihat arsip', en: 'View archive' },
  showActive: { id: 'Kembali ke daftar aktif', en: 'Back to the active list' },
  archiveTitle: { id: 'Arsip', en: 'Archive' },
}

// An Urungkan that failed (the archive toast had gone): what did not happen, and a retry. Success is a toast.
export function UndoFailedNotice({ kind }: { kind: ReferenceKind }) {
  const { t } = useI18n()
  const location = useLocation()
  const restore = useRestore(kind)
  const [retrying, setRetrying] = useState(false)
  const failure = (location.state as { undoFailed?: UndoFailure } | null)?.undoFailed
  if (!failure) return null
  const retry = async () => { setRetrying(true); try { await restore(failure.record) } finally { setRetrying(false) } }
  return (
    <StatusPanel tone="error" title={t(archiveCopy.undoFailed, { name: failure.record.name })}
      action={retrying ? undefined : { label: t(commonMessages.retry), onAction: () => void retry() }}>
      <p>{failure.message}</p>
    </StatusPanel>
  )
}

// Switches the list between active records and the archive; the choice lives in the URL so opening a row keeps it.
export function ArchiveToggle({ kind, archive }: { kind: ReferenceKind; archive: boolean }) {
  const { t } = useI18n()
  const path = `/admin/${referenceConfig[kind].path}`
  return (
    <Link to={archive ? path : `${path}?view=archive`} replace
      className="state-layer pressable flex min-h-12 items-center justify-center gap-2 self-center rounded-sm px-3 text-label font-semibold text-primary">
      <Archive aria-hidden="true" className="size-4" />{t(archive ? copy.showActive : copy.showArchive)}
    </Link>
  )
}

// Heading words for the archive view of a list.
export function ArchiveHeading({ kind }: { kind: ReferenceKind }) {
  const { t } = useI18n()
  return <>{t(copy.archiveTitle)} · {t(referenceConfig[kind].label)}</>
}
