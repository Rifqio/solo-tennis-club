import { Link } from 'react-router-dom'
import { ArrowRight, Images } from 'lucide-react'
import { formatClubDateShort } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import type { AlbumSummary } from '@shared/api/session-photos'
import { photoMessages as messages } from './photos.messages'
import { useRecentAlbums } from './use-albums'

// One session's album: its cover, the class, the date and how many photos (boards 9, D11).
export function AlbumCard({ album, className }: { album: AlbumSummary; className?: string }) {
  const { language, t } = useI18n()
  const date = formatClubDateShort(album.session.date, language)
  return (
    <Link to={`/sessions/${album.session.id}/photos`} viewTransition data-nav="push"
      aria-label={t(messages.albumCard, { name: album.session.className, date, count: album.count })}
      className={cn('group pressable relative block overflow-hidden rounded-[1rem] bg-ink text-white', className)}>
      <img src={album.cover.url} alt="" loading="lazy" decoding="async"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-[var(--ease-emphasized)] lg:group-hover:scale-[1.03]" />
      <span aria-hidden="true" className="absolute inset-0 photo-scrim-bottom" />
      <span aria-hidden="true" className="absolute inset-x-3.5 bottom-3 flex flex-col leading-tight">
        <span className="line-clamp-2 text-title font-bold">{album.session.className}</span>
        <span className="flex items-center gap-1.5 text-label">{date} · <Images className="size-3.5" strokeWidth={2.25} />{album.count}</span>
      </span>
    </Link>
  )
}

// "Foto terbaru" on the club page: the newest albums in a sideways row on phones, three across on desktop. Nothing
// shows until there is at least one album, so a new club does not open on an empty shelf.
export function LatestPhotos({ desktop = false }: { desktop?: boolean }) {
  const { t } = useI18n()
  const { result } = useRecentAlbums(desktop ? 3 : 8)
  const albums = result?.kind === 'ok' ? result.data.albums : []
  if (!albums.length) return null
  const seeAll = (
    <Link to="/photos" viewTransition data-nav="push" className="pressable flex min-h-12 items-center gap-1.5 font-semibold text-primary max-lg:text-label">
      {t(messages.seeAll)}{desktop && <ArrowRight aria-hidden="true" className="size-[1.125rem]" strokeWidth={2.25} />}
    </Link>
  )
  if (desktop) return (
    <section aria-labelledby="photos-title" className="flex flex-col gap-8">
      <div className="flex items-end justify-between gap-6">
        <h2 id="photos-title" className="text-[clamp(2rem,3.4vw,3rem)] font-bold leading-tight">{t(messages.latest)}</h2>
        {seeAll}
      </div>
      <ul className="grid grid-cols-3 gap-6">
        {albums.map(album => <li key={album.session.id}><AlbumCard album={album} className="aspect-[4/5] rounded-xl" /></li>)}
      </ul>
    </section>
  )
  return (
    <section aria-labelledby="photos-title" className="-mx-4 sm:-mx-6 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 px-4 sm:px-6">
        <h2 id="photos-title" className="text-title font-bold">{t(messages.latest)}</h2>
        {seeAll}
      </div>
      <ul className="flex snap-x gap-2.5 overflow-x-auto px-4 sm:px-6 [scrollbar-width:none]">
        {albums.map(album => <li key={album.session.id} className="w-[13.75rem] shrink-0 snap-start"><AlbumCard album={album} className="h-[16.25rem]" /></li>)}
      </ul>
    </section>
  )
}
