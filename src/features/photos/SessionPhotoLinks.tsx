import { Link } from 'react-router-dom'
import { ChevronRight, Images } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { SessionPhotoPreview } from '@shared/api/session-photos'
import { photoMessages as messages } from './photos.messages'

// A finished booking in Riwayat (board 9e): the album's first photo as a small stacked print with the count on it.
export function PhotoStackLink({ sessionId, className, photos }: { sessionId: string; className: string; photos: SessionPhotoPreview }) {
  const { t } = useI18n()
  const first = photos.preview[0]
  if (!first) return null
  return (
    <Link to={`/sessions/${sessionId}/photos`} viewTransition data-nav="push" title={t(messages.sessionPhotos)}
      aria-label={t(messages.sessionPhotosLabel, { count: photos.count, name: className })}
      className="pressable relative block size-12 shrink-0">
      <span aria-hidden="true" className="absolute left-1 top-1 size-10 rounded-[0.375rem] bg-outline-variant" />
      <img src={first.url} alt="" loading="lazy" className="absolute left-0 top-0 size-10 rounded-[0.375rem] border-2 border-surface-container-lowest object-cover" />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-full bg-primary px-[0.3125rem] text-label leading-none font-bold tabular-nums text-on-primary">{photos.count}</span>
    </Link>
  )
}

// The booking's panel after the session (board D4): three photos and "Lihat 12 foto sesi".
export function PhotoMosaicLink({ sessionId, photos, className }: { sessionId: string; photos: SessionPhotoPreview; className?: string }) {
  const { t } = useI18n()
  if (!photos.count) return null
  const [first, ...rest] = photos.preview
  return (
    <Link to={`/sessions/${sessionId}/photos`} viewTransition data-nav="push"
      className={cn('state-layer pressable flex flex-col gap-2.5 rounded-[1rem] bg-surface p-3.5 text-on-surface', className)}>
      <span aria-hidden="true" className={cn('grid gap-1 overflow-hidden rounded-[0.625rem]', rest.length ? 'grid-cols-[2fr_1fr] grid-rows-[4.375rem_4.375rem]' : 'h-36')}>
        <img src={first.url} alt="" loading="lazy" className={cn('size-full object-cover', rest.length > 1 && 'row-span-2')} />
        {rest.map(photo => <img key={photo.id} src={photo.url} alt="" loading="lazy" className={cn('size-full object-cover', rest.length === 1 && 'row-span-2')} />)}
      </span>
      <span className="flex items-center justify-between gap-2 font-semibold text-primary">
        <span className="flex items-center gap-2"><Images aria-hidden="true" className="size-5" />{t(messages.seeSessionPhotos, { count: photos.count })}</span>
        <ChevronRight aria-hidden="true" className="size-5" strokeWidth={2.25} />
      </span>
    </Link>
  )
}
