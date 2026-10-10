import type { ReferenceUsage } from '@shared/api/admin-references'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { useI18n } from '@/i18n/use-i18n'

const copy = {
  title: { id: 'Arsipkan {name}?', en: 'Archive {name}?' },
  body: { id: 'Hilang dari daftar dan dari pilihan kelas atau sesi baru. Bisa dipulihkan kapan saja dari Arsip.', en: 'It leaves the list and the choices for new classes and sessions. You can restore it from the archive at any time.' },
  keeps: { id: 'Kelas ini tetap memakainya:', en: 'These classes keep it:' },
  cancel: { id: 'Batal', en: 'Cancel' },
  confirm: { id: 'Arsipkan', en: 'Archive' },
  archiving: { id: 'Mengarsipkan...', en: 'Archiving...' },
}

// Archiving never takes a coach, level or venue off a class: those classes and their sessions keep it.
export function ArchiveDialog({ open, name, usage, pending, onConfirm, onClose }: { open: boolean; name: string; usage: ReferenceUsage | null; pending: boolean; onConfirm: () => void; onClose: () => void }) {
  const { t } = useI18n()
  const classes = usage?.classes ?? []
  return (
    <Sheet open={open} onClose={onClose} title={t(copy.title, { name })} description={t(copy.body)} closeLabel={t(copy.cancel)}
      footer={<div className="flex flex-wrap justify-end gap-3">
        <Button variant="outlined" onClick={onClose}>{t(copy.cancel)}</Button>
        <Button variant="filled" onClick={onConfirm} pendingLabel={pending ? t(copy.archiving) : undefined}>{t(copy.confirm)}</Button>
      </div>}>
      <p>{t(copy.body)}</p>
      {classes.length > 0 && <div className="flex flex-col gap-2">
        <p className="font-semibold">{t(copy.keeps)}</p>
        <ul className="border-t border-outline-variant">
          {classes.map(row => <li key={row.id} className="flex flex-col border-b border-outline-variant py-3 leading-snug">
            <span className="font-bold">{row.name}</span>
            <span className="text-label text-on-surface-variant">{row.levelName} · {row.venueName}</span>
          </li>)}
        </ul>
      </div>}
    </Sheet>
  )
}
