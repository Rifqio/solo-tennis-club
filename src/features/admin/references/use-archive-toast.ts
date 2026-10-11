import { useNavigate } from 'react-router-dom'
import type { ReferenceKind, ReferenceRecord } from '@shared/api/admin-references'
import { useToast } from '@/components/ui/use-toast'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { useI18n } from '@/i18n/use-i18n'
import { useAdminAuth } from '../auth/use-admin-auth'
import { adminMessages as messages } from '../forms/admin.messages'
import { referenceConfig } from './reference-config'

export const archiveCopy = {
  archived: { id: '{name} diarsipkan.', en: '{name} archived.' },
  restored: { id: '{name} dipulihkan.', en: '{name} restored.' },
  undo: { id: 'Urungkan', en: 'Undo' },
  undoFailed: { id: '{name} belum dipulihkan.', en: '{name} was not restored.' },
}

export interface UndoFailure { record: ReferenceRecord; message: string }

// Restores an archived record and confirms it with a toast. The list on screen refreshes if it is this kind's list.
// A failure lands on the list as a notice with "Coba lagi" (G1: an action that failed needs a panel, not a toast).
export function useRestore(kind: ReferenceKind) {
  const toast = useToast()
  const { send } = useAdminAuth()
  const navigate = useNavigate()
  const { t } = useI18n()
  const path = `/admin/${referenceConfig[kind].path}`
  return async (record: ReferenceRecord) => {
    const result = await send<ReferenceRecord>('POST', `/api${path}/${record.id}/restore`, { version: record.version })
    if (result.kind === 'ok') {
      toast({ message: t(archiveCopy.restored, { name: record.name }) })
      if (window.location.pathname === path) navigate(path, { replace: true, state: { savedId: record.id } })
      return true
    }
    if (result.kind === 'aborted') return false
    const message = t(result.kind === 'http' ? apiErrorMessages[result.code] ?? apiErrorMessages.INTERNAL : messages.saveError)
    navigate(path, { replace: true, state: { undoFailed: { record, message } satisfies UndoFailure } })
    return false
  }
}

// After archiving: "{name} diarsipkan." with Urungkan for 6 seconds, which restores it against the version the archive
// returned. No panel on the list as well; the toast is the one confirmation.
export function useArchivedToast(kind: ReferenceKind) {
  const toast = useToast()
  const { t } = useI18n()
  const restore = useRestore(kind)
  return (record: ReferenceRecord) => toast({
    message: t(archiveCopy.archived, { name: record.name }),
    undo: { label: t(archiveCopy.undo), run: () => void restore(record) },
  })
}
