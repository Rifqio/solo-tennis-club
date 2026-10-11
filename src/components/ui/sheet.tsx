import { Dialog } from 'radix-ui'
import { useEffect, useRef, useState } from 'react'
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
  // Wider on tablets and desktops, for a grid of choices (the coach picker's full list).
  wide?: boolean
  children: ReactNode
}

// Bottom sheet on phones, centred dialog from 640px. White, 24px top corners.
export function Sheet({ open, onClose, title, description, closeLabel, closeIcon = false, returnFocus, tone = 'plain', band, footer, wide = false, children }: SheetProps) {
  const court = tone === 'court'
  // Opening a dialog does a burst of work in the tap (render, scroll lock, focus trap). A CSS animation started then
  // loses its first frames to that work and the sheet appears to jump. So the sheet mounts below the screen edge and
  // only starts rising on the second frame after it is committed, when the main thread is free.
  const [risen, setRisen] = useState(false)
  const content = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) { const reset = requestAnimationFrame(() => setRisen(false)); return () => cancelAnimationFrame(reset) }
    let second = 0
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setRisen(true)) })
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second) }
  }, [open])
  return <Dialog.Root open={open} onOpenChange={value => { if (!value) onClose() }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim duration-180 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-120" />
    <Dialog.Content ref={content}
      // Focus moves in on the next frame: after the tap's work (so it forces no layout in the middle of it), but long
      // before a key press, so Tab can never reach the page behind while the sheet is still rising.
      onOpenAutoFocus={event => { event.preventDefault(); requestAnimationFrame(() => content.current?.focus({ preventScroll: true })) }}
      onCloseAutoFocus={event => {
      const target = returnFocus?.current?.isConnected ? returnFocus.current : document.querySelector<HTMLElement>('[data-schedule-heading]')
      if (target) { event.preventDefault(); target.focus() }
    }}
      className={cn(!risen && 'max-sm:translate-y-full', "fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh_-_1rem)] flex-col overflow-hidden rounded-t-lg bg-surface-container-lowest text-on-surface shadow-sheet outline-none max-sm:transition-transform max-sm:duration-[340ms] max-sm:ease-[cubic-bezier(0.32,0.72,0,1)] max-sm:data-[state=closed]:sheet-exit duration-200 sm:data-[state=open]:animate-in sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:animate-out sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=closed]:duration-120 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%_-_2rem)] sm:max-w-[40rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg", wide && 'sm:max-w-[61rem]')}>
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
