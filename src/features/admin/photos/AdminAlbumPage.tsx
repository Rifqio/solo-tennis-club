import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { Link, useBlocker, useParams } from 'react-router-dom'
import { AlertDialog } from 'radix-ui'
import { Check, ImagePlus, TriangleAlert, Upload, WifiOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { useToast } from '@/components/ui/use-toast'
import { commonMessages } from '@/i18n/common.messages'
import { formatClubDateShort } from '@/i18n/format'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/use-media-query'
import type { AdminResult } from '@/lib/admin-api'
import type { AdminAlbumResponse, AdminSessionPhoto } from '@shared/api/session-photos'
import { SampleDataNotice } from '@/features/public/schedule/SampleDataNotice'
import { useAdminAuth } from '../auth/use-admin-auth'
import { AdminBand } from '../shell/AdminBand'
import { adminPhotoMessages as messages } from './admin-photos.messages'
import { useAlbumUploads } from './use-photo-uploads'
import type { UploadItem } from './use-photo-uploads'

const notice = 'flex items-start gap-2.5 rounded-sm px-3.5 py-3 text-label'

// The admin's album for one session (boards 18, D13). One way in: Upload foto. Pilih turns the album into a selection,
// and the tray holds the edits: make one photo the thumbnail, or delete (with Urungkan).
export function Component() {
  const { id = '' } = useParams()
  const { get, send, state } = useAdminAuth()
  const { language, t } = useI18n()
  const toast = useToast()
  const wide = useMediaQuery('(min-width: 64rem)')
  const [result, setResult] = useState<AdminResult<AdminAlbumResponse> | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [selecting, setSelecting] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const drag = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    void get<AdminAlbumResponse>(`/api/admin/sessions/${encodeURIComponent(id)}/photos`, controller.signal)
      .then(response => { if (!controller.signal.aborted) setResult(response) })
    return () => controller.abort()
  }, [get, id, attempt])
  const album = result?.kind === 'ok' ? result.data : null
  const setAlbum = (next: AdminAlbumResponse) => setResult({ kind: 'ok', data: next })

  const uploads = useAlbumUploads({
    sessionId: id,
    csrfToken: state.status === 'signedIn' ? state.info.csrfToken : undefined,
    onUploaded: useCallback((photo: AdminSessionPhoto) => setResult(current => current?.kind === 'ok'
      ? { kind: 'ok', data: { ...current.data, photos: [...current.data.photos, { ...photo, isCover: current.data.photos.length === 0 }] } }
      : current), []),
    onBatchDone: useCallback((count: number) => toast({ message: t(messages.uploaded, { count }) }), [toast, t]),
    onSignedOut: useCallback(() => setAttempt(value => value + 1), []),
  })

  // Leaving while photos are still going asks first (board 18, "keluar saat upload").
  const blocker = useBlocker(({ currentLocation, nextLocation }) => uploads.pending > 0 && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (!uploads.pending) return
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [uploads.pending])

  const pickFiles = (files: FileList | null) => {
    if (!files?.length || !album) return
    void uploads.add(Array.from(files))
  }
  const toggleSelecting = () => { setSelecting(value => !value); setPicked([]) }
  const run = async (work: () => Promise<AdminResult<AdminAlbumResponse>>, done: (data: AdminAlbumResponse) => void) => {
    setBusy(true)
    const response = await work()
    setBusy(false)
    if (response.kind === 'ok') { setAlbum(response.data); done(response.data) }
    else if (response.kind !== 'aborted') toast({ message: t(messages.actionFailed) })
  }
  const base = `/api/admin/sessions/${encodeURIComponent(id)}/photos`
  const makeCover = () => {
    if (picked.length !== 1 || busy) return
    void run(() => send<AdminAlbumResponse>('PUT', `${base}/cover`, { photoId: picked[0] }), () => {
      setSelecting(false); setPicked([]); toast({ message: t(messages.coverChanged) })
    })
  }
  const removePicked = () => {
    if (!picked.length || busy) return
    const photoIds = picked
    void run(() => send<AdminAlbumResponse>('POST', `${base}/delete`, { photoIds }), () => {
      setSelecting(false); setPicked([])
      toast({ message: t(messages.removed, { count: photoIds.length }), undo: { label: t(messages.undo), run: () => void run(() => send<AdminAlbumResponse>('POST', `${base}/restore`, { photoIds }), () => {}) } })
    })
  }

  // Desktop: files dragged anywhere over the page can be dropped in (board D13).
  const onDragEnter = (event: DragEvent) => { if (!wide || !event.dataTransfer.types.includes('Files')) return; drag.current++; setDragging(true) }
  const onDragLeave = () => { if (!wide) return; drag.current = Math.max(0, drag.current - 1); if (!drag.current) setDragging(false) }
  const onDrop = (event: DragEvent) => { event.preventDefault(); drag.current = 0; setDragging(false); pickFiles(event.dataTransfer.files) }

  const back = { to: '/admin/sessions' + (album ? `?date=${album.session.date}` : ''), label: t(messages.back) }
  if (!album) {
    return <>
      <AdminBand title={t(messages.photos)} back={back} />
      <div className="page-gutter desk-column mx-auto w-full max-w-[50rem] py-4">
        {!result || (result.kind === 'http' && result.status === 401)
          ? <><p role="status" className="sr-only">{t(messages.loading)}</p><div aria-hidden="true" className="appear-late columns-2 gap-2 lg:columns-4">{[0, 1, 2, 3].map(key => <div key={key} className={cn('mb-2 rounded-[0.75rem] bg-surface-container', key % 3 ? 'h-36' : 'h-52')} />)}</div></>
          : <StatusPanel tone="error" title={t(messages.error)} action={{ label: t(commonMessages.retry), onAction: () => { setResult(null); setAttempt(value => value + 1) } }} />}
      </div>
    </>
  }

  const { session, photos } = album
  const failed = uploads.items.filter(item => item.status === 'failed')
  const going = uploads.items.length - failed.length
  const offline = !uploads.online && going > 0
  const full = photos.length + going >= album.maxPhotos
  const facts = `${formatClubDateShort(session.date, language)} · ${session.startTime} · ${session.venueName}`
  const uploadButton = (className?: string) => (
    <Button variant="accent" className={cn('min-h-14', className)} disabled={session.cancelled || full} onClick={() => input.current?.click()}>
      <Upload aria-hidden="true" className="size-5" strokeWidth={2.25} />{t(messages.upload)}
    </Button>
  )
  const skipped = uploads.skipped
  const skippedCount = skipped ? skipped['not-photo'] + skipped['too-big'] + skipped.unreadable : 0
  const hasTiles = photos.length > 0 || uploads.items.length > 0
  const one = picked.length === 1

  return (
    <div onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={event => { if (wide) event.preventDefault() }} onDrop={onDrop}>
      <AdminBand title={session.className} back={back} subtitle={<p className="tabular-nums">{facts}</p>} action={wide ? uploadButton('px-6') : undefined} />
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={event => { pickFiles(event.target.files); event.target.value = '' }} />
      <div className={cn('page-gutter desk-column mx-auto flex w-full max-w-[50rem] flex-col gap-3 py-4 lg:gap-4 lg:py-5', !wide && 'pb-[calc(7.5rem+env(safe-area-inset-bottom))]')}>
        {session.isSample && <SampleDataNotice />}
        {session.cancelled && <StatusPanel tone="info" title={t(messages.cancelled)} />}
        {offline && <div role="alert" className={cn(notice, 'bg-warning-container text-warning')}><WifiOff aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><span><strong>{t(messages.offlineTitle)}</strong> {t(messages.offlineBody)}</span></div>}
        <section aria-labelledby="album-count" className="relative flex flex-col gap-3">
          <div className="flex min-h-12 items-center justify-between gap-3">
            <h2 id="album-count" className="text-title font-bold tabular-nums">{going ? t(messages.countGoing, { count: photos.length, going }) : t(messages.count, { count: photos.length })}</h2>
            {photos.length > 0 && <span className="flex items-center gap-1">
              {wide && !selecting && <Link to={`/sessions/${session.id}/photos`} className="pressable flex min-h-12 items-center px-3 font-semibold text-primary">{t(messages.asMember)}</Link>}
              <Button variant="outlined" className="min-h-11 rounded-full bg-surface-container-lowest px-4" onClick={toggleSelecting}>{t(selecting ? messages.cancel : messages.pick)}</Button>
            </span>}
          </div>
          {skipped && skippedCount > 0 && (
            <div role="alert" className={cn(notice, 'bg-warning-container py-2.5 pr-1.5 text-warning')}>
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <span className="flex-1"><strong className="block text-body">{t(messages.skippedTitle, { count: skippedCount })}</strong>
                {[skipped['not-photo'] && t(messages.skippedNotPhoto), skipped['too-big'] && t(messages.skippedTooBig), skipped.unreadable && t(messages.skippedUnreadable)].filter(Boolean).join(' ')}</span>
              <button type="button" onClick={uploads.clearSkipped} aria-label={t(messages.dismiss)} className="state-layer flex size-11 shrink-0 items-center justify-center rounded-full"><X aria-hidden="true" className="size-5" /></button>
            </div>
          )}
          {failed.length > 0 && !offline && (
            <div role="alert" className={cn(notice, 'items-center bg-error-container py-2.5 pr-2.5 text-on-error-container')}>
              <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
              <span className="flex-1"><strong className="block text-body">{t(messages.failedTitle, { count: failed.length })}</strong>{t(messages.failedBody)}</span>
              <Button variant="outlined" className="min-h-11 shrink-0 border-current bg-surface-container-lowest px-4 text-error" onClick={() => uploads.retry(failed.map(item => item.key))}>{t(messages.retry)}</Button>
            </div>
          )}
          {full && !session.cancelled && <StatusPanel tone="info" title={t(messages.full, { max: album.maxPhotos })} />}
          {hasTiles ? (
            <div className="columns-2 gap-2 sm:columns-3 lg:columns-4 lg:gap-3">
              {photos.map((photo, index) => {
                const on = picked.includes(photo.id)
                return (
                  <div key={photo.id} className={cn('relative mb-2 break-inside-avoid overflow-hidden rounded-[0.75rem] bg-surface-container-high lg:mb-3', on && 'outline outline-3 -outline-offset-3 outline-primary')}
                    style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
                    <img src={photo.url} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                    {photo.isCover && !selecting && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-ink/70 px-2.5 py-0.5 text-label font-semibold text-white">{t(messages.cover)}</span>}
                    {selecting && (
                      <button type="button" aria-pressed={on} aria-label={t(messages.pickPhoto, { index: index + 1 })}
                        onClick={() => setPicked(list => on ? list.filter(item => item !== photo.id) : [...list, photo.id])}
                        className={cn('absolute inset-0 focus-visible:outline-3 focus-visible:-outline-offset-3', on ? 'bg-primary/20' : 'bg-transparent')}>
                        <span className={cn('absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full border-2 border-white', on ? 'check-enter bg-primary text-white' : 'bg-ink/25 text-transparent')}>
                          <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}
              {uploads.items.map((item, index) => <UploadTile key={item.key} item={item} index={photos.length + index + 1} offline={!uploads.online} onRetry={() => uploads.retry([item.key])} />)}
            </div>
          ) : (
            <button type="button" onClick={() => input.current?.click()} disabled={session.cancelled}
              className="state-layer flex min-h-[22.5rem] flex-1 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-surface-container-lowest p-6 text-center text-primary">
              <ImagePlus aria-hidden="true" className="size-10" strokeWidth={1.75} />
              <span className="text-title font-bold text-on-surface">{t(messages.emptyTitle)}</span>
              <span className="text-on-surface-variant">{t(wide ? messages.emptyDesk : messages.emptyPhone)}</span>
            </button>
          )}
          {dragging && <div aria-hidden="true" className="appear-late pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary-container/90 text-title font-bold text-primary">{t(messages.drop)}</div>}
          {photos.length > 0 && !wide && <Link to={`/sessions/${session.id}/photos`} className="pressable flex min-h-12 items-center self-center font-semibold text-primary">{t(messages.asMember)}</Link>}
        </section>
        {/* Desktop Pilih: the edits in one bar under the album. */}
        {wide && selecting && (
          <div role="toolbar" data-bottom-chrome aria-label={t(messages.pickPhotos)} className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-lg bg-surface-container-lowest px-5 py-3 shadow-sheet">
            <span className="mr-auto font-semibold tabular-nums">{picked.length ? t(messages.picked, { count: picked.length }) : t(messages.pickPhotos)}</span>
            <Button variant="outlined" aria-disabled={!one} onClick={makeCover}>{t(messages.makeCover)}</Button>
            <Button variant="outlined" aria-disabled={!picked.length} className={cn(picked.length && 'border-error text-error')} onClick={removePicked}>{picked.length > 1 ? t(messages.removeMany, { count: picked.length }) : t(messages.remove)}</Button>
            <Button variant="filled" onClick={toggleSelecting}>{t(messages.done)}</Button>
          </div>
        )}
      </div>
      {/* Phones and tablets: one bar at the bottom; Upload foto, or the tray while selecting. */}
      {!wide && (
        <div data-bottom-chrome className="fixed inset-x-0 bottom-0 z-20 rounded-t-lg border-t border-outline-variant bg-surface-container-lowest px-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-3 sm:left-20">
          {selecting ? (
            <div role="toolbar" aria-label={t(messages.pickPhotos)} className="mx-auto flex max-w-[50rem] flex-col gap-2">
              <span className="text-center font-semibold tabular-nums">{picked.length ? t(messages.picked, { count: picked.length }) : t(messages.pickPhotos)}</span>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outlined" className="min-h-13" aria-disabled={!one} onClick={makeCover}>{t(messages.makeCover)}</Button>
                <Button variant="outlined" className={cn('min-h-13', picked.length && 'border-error text-error')} aria-disabled={!picked.length} onClick={removePicked}>{picked.length > 1 ? t(messages.removeMany, { count: picked.length }) : t(messages.remove)}</Button>
              </div>
            </div>
          ) : <div className="mx-auto flex max-w-[50rem] flex-col">{uploadButton()}</div>}
        </div>
      )}
      <AlertDialog.Root open={blocker.state === 'blocked'} onOpenChange={open => { if (!open && blocker.state === 'blocked') blocker.reset() }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-40 bg-scrim dialog-scrim" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-[calc(100%_-_2rem)] max-w-[26.25rem] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 text-on-surface shadow-sheet dialog-panel">
            <div className="flex flex-col gap-1.5">
              <AlertDialog.Title className="text-title font-bold">{t(messages.leaveTitle)}</AlertDialog.Title>
              <AlertDialog.Description className="text-on-surface-variant">{t(messages.leaveBody, { count: uploads.pending })}</AlertDialog.Description>
            </div>
            <div className="flex flex-col gap-2">
              <AlertDialog.Cancel asChild><Button variant="accent" className="min-h-13">{t(messages.stay)}</Button></AlertDialog.Cancel>
              <AlertDialog.Action asChild><Button variant="outlined" className="min-h-13 text-error" onClick={() => { uploads.cancelAll(); if (blocker.state === 'blocked') blocker.proceed() }}>{t(messages.leave)}</Button></AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

// A photo on its way up: the local preview at half strength with a progress line, "Nunggu koneksi" while offline, or
// "Gagal upload" with Ulangi.
function UploadTile({ item, index, offline, onRetry }: { item: UploadItem; index: number; offline: boolean; onRetry: () => void }) {
  const { t } = useI18n()
  const paused = offline && item.status !== 'failed'
  return (
    <div className="relative mb-2 break-inside-avoid overflow-hidden rounded-[0.75rem] bg-surface-container-high lg:mb-3" style={{ aspectRatio: `${item.width} / ${item.height}` }}>
      <img src={item.preview} alt="" className="size-full object-cover opacity-45" />
      {item.status !== 'failed' && !paused && (
        <span role="progressbar" aria-label={t(messages.uploading, { index })} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(item.progress * 100)}
          className="absolute inset-x-0 bottom-0 h-1 bg-white/55">
          <span className="block h-full bg-primary transition-[width] duration-200" style={{ width: `${Math.max(6, item.progress * 100)}%` }} />
        </span>
      )}
      {item.status === 'preparing' && !paused && <span className="absolute bottom-3 left-2.5 rounded-full bg-ink/70 px-2.5 py-0.5 text-label font-semibold text-white">{t(messages.preparing)}</span>}
      {paused && <span className="absolute bottom-3 left-2.5 rounded-full bg-ink/70 px-2.5 py-0.5 text-label font-semibold text-white">{t(messages.waitingOnline)}</span>}
      {item.status === 'failed' && !offline && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/60 text-white">
          <span className="font-semibold">{t(messages.failed)}</span>
          <button type="button" onClick={onRetry} className="pressable min-h-10 rounded-full bg-white px-4 font-semibold text-on-surface">{t(messages.retry)}</button>
        </span>
      )}
    </div>
  )
}
