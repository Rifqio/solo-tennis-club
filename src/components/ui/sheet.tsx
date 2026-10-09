import { Dialog } from 'radix-ui'
import type { ReactNode, RefObject } from 'react'
import { X } from 'lucide-react'
import { Button, IconButton } from './button'
export function Sheet({ open, onClose, title, description, closeLabel, closeIcon = false, returnFocus, children }: {
  open: boolean; onClose: () => void; title: string; description: string; closeLabel: string; closeIcon?: boolean; returnFocus?: RefObject<HTMLElement | null>; children: ReactNode
}) {
  return <Dialog.Root open={open} onOpenChange={value => { if (!value) onClose() }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim duration-180 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-120" />
    <Dialog.Content onCloseAutoFocus={event => {
      const target = returnFocus?.current?.isConnected ? returnFocus.current : document.querySelector<HTMLElement>('[data-schedule-heading]')
      if (target) { event.preventDefault(); target.focus() }
    }}
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh_-_1rem)] flex-col rounded-t-xl bg-surface-container-low text-on-surface shadow-sheet outline-none duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:duration-120 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%_-_2rem)] sm:max-w-[40rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-outline-variant p-4">
        <Dialog.Title className="min-w-0 flex-1 break-words text-title font-bold">{title}</Dialog.Title>
        <Dialog.Close asChild>{closeIcon
          ? <IconButton label={closeLabel}><X aria-hidden="true" className="size-5" /></IconButton>
          : <Button variant="text">{closeLabel}</Button>}
        </Dialog.Close>
        <Dialog.Description className="sr-only">{description}</Dialog.Description>
      </header>
      <div className="flex min-h-0 flex-col gap-5 overflow-y-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>
}
