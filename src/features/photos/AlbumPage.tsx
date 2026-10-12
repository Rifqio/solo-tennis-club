import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Download, Share } from 'lucide-react'
import { StatusPanel } from '@/components/ui/status-panel'
import { useToast } from '@/components/ui/use-toast'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort, formatClubTime } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/use-media-query'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { clubDateOf } from '@shared/club-time'
import type { SessionPhoto } from '@shared/api/session-photos'
import { PhotoViewer } from './PhotoViewer'
import { photoMessages as messages } from './photos.messages'
import { photoFileName, shareLink } from './share-link'
import { usePublicAlbum } from './use-albums'

// Phones: two columns, each photo at its own shape, every photo going to the shorter column, so it reads like a
// camera roll (board 9f). Desktop lets CSS columns do the same at 280px (board D12).
function splitColumns(photos: SessionPhoto[]) {
  const columns: { photo: SessionPhoto; index: number }[][] = [[], []]
  const heights = [0, 0]
  photos.forEach((photo, index) => {
    const column = heights[0] <= heights[1] ? 0 : 1
    columns[column].push({ photo, index })
    heights[column] += photo.height / photo.width
  })
  return columns
}

function Tile({ photo, index, count, onOpen, className }: { photo: SessionPhoto; index: number; count: number; onOpen: (index: number) => void; className?: string }) {
  const { t } = useI18n()
  return (
    <button type="button" onClick={() => onOpen(index)} aria-label={t(messages.open, { index: index + 1, count })}
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
      className={cn('group pressable relative block w-full overflow-hidden rounded-[0.625rem] bg-surface-container-high lg:rounded-[0.875rem]', className)}>
      <img src={photo.url} alt="" loading={index < 6 ? 'eager' : 'lazy'} decoding="async"
        className="size-full object-cover transition-transform duration-500 ease-[var(--ease-emphasized)] lg:group-hover:scale-[1.03]" />
    </button>
  )
}

export function Component() {
  const { id = '' } = useParams()
  const { language, t } = useI18n()
  const { result, retry } = usePublicAlbum(id)
  const [open, setOpen] = useState(-1)
  const isDesktop = useMediaQuery('(min-width: 64rem)')
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const album = result?.kind === 'ok' ? result.data : null
  // Back returns to wherever the album was opened from; a shared link opened cold goes to all albums.
  const goBack = () => { if (location.key !== 'default') navigate(-1); else navigate('/photos', { viewTransition: true }) }
  const share = useCallback(async () => {
    if (!album) return
    if (await shareLink(window.location.href, album.session.className) === 'copied') toast({ message: t(messages.linkCopied) })
  }, [album, t, toast])
  const columns = useMemo(() => splitColumns(album?.photos ?? []), [album])

  if (!album) {
    return (
      <div className="flex flex-col">
        <div className="relative h-[23.75rem] bg-ink lg:hidden">
          <BackButton onBack={goBack} className="absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))]" />
        </div>
        <div className="page-gutter mx-auto flex w-full max-w-[80rem] flex-col gap-4 py-4 lg:py-5">
          {!result ? <>
            <p role="status" className="sr-only">{t(messages.loading)}</p>
            <div aria-hidden="true" className="appear-late hidden h-[25rem] rounded-xl bg-surface-container lg:block" />
            <div aria-hidden="true" className="appear-late grid grid-cols-2 gap-1.5 lg:grid-cols-4 lg:gap-3">
              {[0, 1, 2, 3].map(key => <div key={key} className={cn('rounded-[0.625rem] bg-surface-container', key % 3 ? 'h-40' : 'h-56')} />)}
            </div>
          </> : <StatusPanel tone="error" title={result.kind === 'http' && result.status === 404 ? t(messages.notFound) : t(messages.error)}
            action={result.kind === 'http' && result.status === 404 ? undefined : { label: t(commonMessages.retry), onAction: retry }} />}
        </div>
      </div>
    )
  }

  const { session, photos } = album
  const cover = photos.find(photo => photo.id === album.coverId) ?? photos[0] ?? null
  const facts = [formatClubDateShort(session.date, language), session.startTime, session.venueName].join(' · ')
  const fileName = (index: number) => photoFileName(session.className, session.date, index, photos[index].url)
  const zipHref = `/api/public/sessions/${encodeURIComponent(session.id)}/photos.zip`
  const viewer = open >= 0 && photos[open] && (
    <PhotoViewer photos={photos} index={open} title={`${session.className} · ${formatClubDateShort(session.date, language)}`}
      fileName={fileName} onIndex={setOpen} onClose={() => setOpen(-1)} onShare={() => void share()} />
  )

  if (isDesktop) {
    return (
      <div className="page-gutter desk-column mx-auto flex w-full max-w-[80rem] flex-col gap-5 pb-12 pt-5">
        <button type="button" onClick={goBack} className="pressable flex min-h-12 items-center gap-1.5 self-start font-semibold text-primary">
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.25} />{t(messages.latest)}
        </button>
        <header className="relative isolate flex h-[25rem] items-end overflow-hidden rounded-xl bg-ink text-white">
          {cover && <img src={cover.url} alt="" className="absolute inset-0 -z-10 size-full object-cover object-[50%_45%]" />}
          <div aria-hidden="true" className="absolute inset-0 -z-10 photo-scrim-bottom" />
          <div className="flex w-full flex-wrap items-end justify-between gap-5 px-8 pb-7">
            <div className="flex flex-col gap-1">
              <span className="font-semibold opacity-90">{facts}</span>
              <h1 tabIndex={-1} className="text-statement font-bold focus:outline-none">{session.className}</h1>
              {album.updatedAt && <span className="opacity-90">{t(messages.uploadedAt, { count: photos.length, date: formatClubDateShort(clubDateOf(new Date(album.updatedAt)), language), time: formatClubTime(album.updatedAt) })}</span>}
            </div>
            {photos.length > 0 && <div className="flex gap-2.5">
              <button type="button" onClick={() => void share()} className="pressable flex min-h-13 items-center gap-2 rounded-full bg-white/20 px-5 font-semibold hover:bg-white/30">
                <Share aria-hidden="true" className="size-5" />{t(messages.share)}
              </button>
              <a href={zipHref} download className="pressable flex min-h-13 items-center gap-2 rounded-full bg-accent px-[1.375rem] font-semibold text-on-accent">
                <Download aria-hidden="true" className="size-5" strokeWidth={2.25} />{t(messages.downloadAll)}
              </a>
            </div>}
          </div>
        </header>
        {session.isSample && <SampleDataNotice />}
        {photos.length === 0 ? <EmptyAlbum /> : (
          <div className="columns-[17.5rem] gap-3">
            {photos.map((photo, index) => <Tile key={photo.id} photo={photo} index={index} count={photos.length} onOpen={setOpen} className="mb-3 break-inside-avoid" />)}
          </div>
        )}
        {viewer}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="relative h-[23.75rem] bg-ink text-white">
        {cover && <img src={cover.url} alt="" className="absolute inset-0 size-full object-cover object-[50%_40%]" />}
        <div aria-hidden="true" className="absolute inset-0 album-scrim" />
        <div className="absolute inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] flex justify-between">
          <BackButton onBack={goBack} />
          {photos.length > 0 && <button type="button" onClick={() => void share()} aria-label={t(messages.shareAlbum)}
            className="pressable flex size-12 items-center justify-center rounded-full bg-ink/45 text-white"><Share aria-hidden="true" className="size-5" /></button>}
        </div>
        <div className="absolute inset-x-5 bottom-5 flex flex-col gap-0.5">
          <span className="text-label font-semibold opacity-90">{facts}</span>
          <h1 tabIndex={-1} className="break-words text-display font-bold focus:outline-none">{session.className}</h1>
          <span className="text-label opacity-90">{t(messages.fromAdmin, { count: photos.length })}</span>
        </div>
      </header>
      {session.isSample && <div className="page-gutter pt-3"><SampleDataNotice /></div>}
      {photos.length === 0 ? <div className="page-gutter py-4"><EmptyAlbum /></div> : <>
        <div className="flex gap-1.5 p-1.5 pb-32">
          {columns.map((column, key) => (
            <div key={key} className="flex min-w-0 flex-1 flex-col gap-1.5">
              {column.map(({ photo, index }) => <Tile key={photo.id} photo={photo} index={index} count={photos.length} onOpen={setOpen} />)}
            </div>
          ))}
        </div>
        {/* Download all floats over the album, on a fade to white so the last photos stay readable behind it. */}
        <div data-bottom-chrome className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center fade-to-surface px-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-8">
          <a href={zipHref} download className="pressable pointer-events-auto flex min-h-13 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-on-accent shadow-fab">
            <Download aria-hidden="true" className="size-5" strokeWidth={2.25} />{t(messages.downloadAll)}
          </a>
        </div>
      </>}
      {viewer}
    </div>
  )
}

function BackButton({ onBack, className }: { onBack: () => void; className?: string }) {
  const { t } = useI18n()
  return (
    <button type="button" onClick={onBack} aria-label={t(messages.back)}
      className={cn('pressable flex size-12 items-center justify-center rounded-full bg-ink/45 text-white', className)}>
      <ChevronLeft aria-hidden="true" className="size-6" />
    </button>
  )
}

function EmptyAlbum() {
  const { t } = useI18n()
  return <StatusPanel tone="info" title={t(messages.empty)}><p>{t(messages.emptyHint)}</p></StatusPanel>
}

