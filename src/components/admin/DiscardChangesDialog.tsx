import { AlertDialog } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/use-i18n'
export function DiscardChangesDialog({ open, onKeep, onDiscard, classChange = false, busy = false }: { open: boolean; onKeep: () => void; onDiscard: () => void; classChange?: boolean; busy?: boolean }) {
  const { t } = useI18n()
  return <AlertDialog.Root open={open} onOpenChange={value => { if (!value) onKeep() }}><AlertDialog.Portal>
    <AlertDialog.Overlay className="fixed inset-0 z-40 bg-scrim dialog-scrim" />
    <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl bg-surface-container p-5 text-on-surface shadow-sheet dialog-panel">
      <AlertDialog.Title className="text-title font-bold">{t(classChange ? { id: 'Ganti kelas?', en: 'Change class?' } : { id: 'Buang perubahan?', en: 'Discard changes?' })}</AlertDialog.Title>
      <AlertDialog.Description>{t(busy ? { id: 'Sedang menyimpan. Tunggu hasil sebelum meninggalkan form.', en: 'Saving is in progress. Wait for the result before leaving the form.' } : classChange ? { id: 'Nilai awal kelas baru akan menggantikan isian sesi.', en: 'The new class defaults will replace the session values.' } : { id: 'Perubahan yang belum disimpan akan hilang.', en: 'Unsaved changes will be lost.' })}</AlertDialog.Description>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <AlertDialog.Cancel asChild><Button variant="tonal" onClick={onKeep}>{t(classChange ? { id: 'Pertahankan kelas', en: 'Keep class' } : { id: 'Tetap mengedit', en: 'Keep editing' })}</Button></AlertDialog.Cancel>
        <AlertDialog.Action asChild><Button variant="filled" disabled={busy} className={classChange ? undefined : 'bg-error text-on-error'} onClick={onDiscard}>{t(classChange ? { id: 'Ganti kelas', en: 'Change class' } : { id: 'Buang perubahan', en: 'Discard changes' })}</Button></AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal></AlertDialog.Root>
}
