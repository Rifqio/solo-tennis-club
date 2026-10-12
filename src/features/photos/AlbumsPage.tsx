import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { AlbumCard } from './AlbumCard'
import { photoMessages as messages } from './photos.messages'
import { useRecentAlbums } from './use-albums'

// "Lihat semua" from Foto terbaru: every session album, newest session first.
export function Component() {
  const { t } = useI18n()
  const { result, retry } = useRecentAlbums(48)
  const albums = result?.kind === 'ok' ? result.data.albums : null
  return (
    <div className="page-gutter desk-column mx-auto flex w-full max-w-[50rem] flex-col gap-4 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))] lg:gap-6 lg:pt-5">
      <Link to="/" viewTransition data-nav="pop" className="pressable -ml-1 flex min-h-12 items-center gap-1.5 self-start font-semibold text-primary">
        <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.25} />{t(messages.club)}
      </Link>
      <div className="flex flex-col gap-1">
        <h1 tabIndex={-1} className="text-headline font-bold focus:outline-none lg:text-display">{t(messages.albumsTitle)}</h1>
        <p className="text-on-surface-variant">{t(messages.albumsIntro)}</p>
      </div>
      {!result ? <>
        <p role="status" className="sr-only">{t(messages.loading)}</p>
        <div aria-hidden="true" className="appear-late grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-6">
          {[0, 1, 2, 3].map(key => <div key={key} className="aspect-[4/5] rounded-[1rem] bg-surface-container" />)}
        </div>
      </> : !albums ? (
        <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: retry }} />
      ) : albums.length === 0 ? (
        <StatusPanel tone="info" title={t(messages.noAlbums)}><p>{t(messages.emptyHint)}</p></StatusPanel>
      ) : (
        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-6">
          {albums.map(album => <li key={album.session.id}><AlbumCard album={album} className="aspect-[4/5]" /></li>)}
        </ul>
      )}
    </div>
  )
}
