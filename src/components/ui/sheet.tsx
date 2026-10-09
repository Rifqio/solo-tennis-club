import { Dialog } from 'radix-ui'
import type { ReactNode, RefObject } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, IconButton } from './button'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  closeLabel: string
  closeIcon?: boolean
  returnFocus?: RefObject<HTMLElement | null>
  // "court": the header becomes a Court Blue strip with the title in white and `band` content under it (session
  // detail, calendar). "plain": a quiet header for utility sheets (time picker, book list).
  tone?: 'plain' | 'court'
  band?: ReactNode
  // Stays pinned under the scrolling body, above the bottom safe area: the sheet's one primary action.
  footer?: ReactNode
  children: ReactNode
}

// Bottom sheet on phones, centred dialog from 640px. White, 24px top corners.
export function Sheet({ open, onClose, title, description, closeLabel, closeIcon = false, returnFocus, tone = 'plain', band, footer, children }: SheetProps) {
  const court = tone === 'court'
  return <Dialog.Root open={open} onOpenChange={value => { if (!value) onClose() }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim duration-180 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-120" />
    <Dialog.Content onCloseAutoFocus={event => {
      const target = returnFocus?.current?.isConnected ? returnFocus.current : document.querySelector<HTMLElement>('[data-schedule-heading]')
      if (target) { event.preventDefault(); target.focus() }
    }}
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh_-_1rem)] flex-col overflow-hidden rounded-t-lg bg-surface-container-lowest text-on-surface shadow-sheet outline-none duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:duration-120 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%_-_2rem)] sm:max-w-[40rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0">
      <header className={cn(
        'flex shrink-0 flex-col gap-3 px-4',
        court ? 'bg-band pb-5 pt-4 text-on-signboard [&_:focus-visible]:outline-white' : 'border-b border-outline-variant py-4',
      )}>
        <div className="flex items-start justify-between gap-3">
          <Dialog.Title className={cn('min-w-0 flex-1 break-words', court ? 'text-headline font-bold' : 'text-title font-semibold')}>{title}</Dialog.Title>
          <Dialog.Close asChild>{closeIcon || court
            ? <IconButton label={closeLabel} className={court ? 'bg-band-tile text-on-signboard' : undefined}><X aria-hidden="true" className="size-5" /></IconButton>
            : <Button variant="text">{closeLabel}</Button>}
          </Dialog.Close>
        </div>
        {band}
        <Dialog.Description className="sr-only">{description}</Dialog.Description>
      </header>
      <div className={cn('flex min-h-0 flex-col gap-5 overflow-y-auto p-4', !footer && 'pb-[max(1.5rem,env(safe-area-inset-bottom))]')}>{children}</div>
      {footer && <div className="shrink-0 border-t border-outline-variant bg-surface-container-lowest px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>
}
