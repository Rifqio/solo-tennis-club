import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import { ChevronLeft, ChevronRight, Download, Share, X } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { SessionPhoto } from '@shared/api/session-photos'
import { photoMessages as messages } from './photos.messages'

interface PhotoViewerProps {
  photos: SessionPhoto[]
  index: number
  title: string
  fileName: (index: number) => string
  onIndex: (index: number) => void
  onClose: () => void
  onShare: () => void
}

const round = 'state-layer pressable flex items-center justify-center rounded-full text-white'

// One photo at full size on black, nothing else competing (boards 9f, D12). A native modal dialog: focus stays inside,
// Esc closes, the page behind is inert. Arrows, the arrow keys, and a sideways swipe move through the album.
export function PhotoViewer({ photos, index, title, fileName, onIndex, onClose, onShare }: PhotoViewerProps) {
  const { t } = useI18n()
  const dialog = useRef<HTMLDialogElement>(null)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const count = photos.length
  const photo = photos[index]
  const go = (step: number) => onIndex((index + step + count) % count)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    element.showModal()
    const root = document.documentElement
    const overflow = root.style.overflow
    root.style.overflow = 'hidden'
    return () => { root.style.overflow = overflow; if (element.open) element.close() }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); onIndex((index - 1 + count) % count) }
      if (event.key === 'ArrowRight') { event.preventDefault(); onIndex((index + 1) % count) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, count, onIndex])

  const onPointerDown = (event: PointerEvent) => { if (event.pointerType !== 'mouse') swipe.current = { x: event.clientX, y: event.clientY } }
  const onPointerUp = (event: PointerEvent) => {
    const start = swipe.current
    swipe.current = null
    if (!start) return
    const dx = event.clientX - start.x, dy = event.clientY - start.y
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1)
  }

  const counter = t(messages.photoOf, { index: index + 1, count })
  const download = (
    <a href={photo.url} download={fileName(index)}
      className="pressable flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 font-semibold text-on-accent">
      <Download aria-hidden="true" className="size-5" strokeWidth={2.25} />
      <span className="lg:hidden">{t(messages.downloadPhoto)}</span><span className="hidden lg:inline">{t(messages.download)}</span>
    </a>
  )
  const arrow = 'absolute top-1/2 z-10 size-12 -translate-y-1/2 bg-ink/40 lg:static lg:size-14 lg:translate-y-0 lg:justify-self-center lg:bg-white/10 lg:hover:bg-white/20'
  return (
    <dialog ref={dialog} aria-label={counter} onCancel={event => { event.preventDefault(); onClose() }}
      className="viewer-in fixed inset-0 m-0 flex size-full max-h-none max-w-none flex-col bg-ink p-0 text-white backdrop:bg-ink [&_:focus-visible]:outline-white">
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] lg:px-6 lg:py-4">
        <button type="button" onClick={onClose} aria-label={t(messages.close)} className={cn(round, 'size-12 lg:hidden')}><X aria-hidden="true" className="size-6" /></button>
        <p className="flex flex-col leading-snug max-lg:items-center">
          <span className="hidden font-bold lg:block">{title}</span>
          <span className="text-label font-semibold tabular-nums lg:font-normal lg:text-white/70">{counter}</span>
        </p>
        <button type="button" onClick={onShare} aria-label={t(messages.sharePhoto)} className={cn(round, 'size-12 lg:hidden')}><Share aria-hidden="true" className="size-5" /></button>
        <div className="hidden items-center gap-2 lg:flex">
          {download}
          <button type="button" onClick={onClose} aria-label={t(messages.close)} className={cn(round, 'size-12 bg-white/10 hover:bg-white/20')}><X aria-hidden="true" className="size-5" /></button>
        </div>
      </div>
      <div className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] items-center lg:grid-cols-[5.5rem_minmax(0,1fr)_5.5rem] lg:pb-8"
        onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipe.current = null }}>
        {count > 1 && <button type="button" onClick={() => go(-1)} aria-label={t(messages.previous)} className={cn(round, arrow, 'left-2')}>
          <ChevronLeft aria-hidden="true" className="size-6" strokeWidth={2.25} />
        </button>}
        <img key={photo.id} src={photo.url} alt={counter} width={photo.width} height={photo.height} draggable={false}
          className={cn('photo-in size-full max-h-full touch-pan-y select-none object-contain lg:max-h-[82vh]', count <= 1 && 'lg:col-start-2')} />
        {count > 1 && <button type="button" onClick={() => go(1)} aria-label={t(messages.next)} className={cn(round, arrow, 'right-2')}>
          <ChevronRight aria-hidden="true" className="size-6" strokeWidth={2.25} />
        </button>}
      </div>
      <div className="flex shrink-0 flex-col gap-3.5 px-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-4 lg:hidden">
        {count > 1 && count <= 20 && <span aria-hidden="true" className="flex justify-center gap-1.5">
          {photos.map((item, at) => <span key={item.id} className={cn('h-1.5 rounded-full transition-[width] duration-200', at === index ? 'w-[1.125rem] bg-accent' : 'w-1.5 bg-white/40')} />)}
        </span>}
        {download}
      </div>
    </dialog>
  )
}
