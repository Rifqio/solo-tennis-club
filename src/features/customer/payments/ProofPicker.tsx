import { useId, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { FileText, ImagePlus, Plus, X } from 'lucide-react'
import { PROOF_CONTENT_TYPES, PROOF_FILE_MAX_BYTES, PROOF_FILES_MAX } from '@shared/api/customer-payments'
import { FieldError } from '@/components/ui/field-error'
import { useI18n } from '@/i18n/use-i18n'
import { listRowMotion } from '@/lib/motion'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { paymentMessages as messages } from './payments.messages'

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// One preview address per chosen image, made once and kept for the page's life (at most three small files). Releasing
// it on unmount would break the preview when React mounts the thumbnail twice in development.
const previews = new WeakMap<File, string>()
function previewOf(file: File) {
  if (!file.type.startsWith('image/')) return null
  let url = previews.get(file)
  if (!url) { url = URL.createObjectURL(file); previews.set(file, url) }
  return url
}

// A chosen file's preview: the image itself, or a document mark for a PDF.
function Thumb({ file }: { file: File }) {
  const url = previewOf(file)
  return (
    <span aria-hidden="true" className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-outline-variant bg-surface-container-lowest text-primary">
      {url ? <img src={url} alt="" className="size-full object-cover" /> : <FileText className="size-5" />}
    </span>
  )
}

// Choosing up to three proof files (03-DECISIONS §2). Checked here for type, size and count so a mistake shows on the
// spot as a field error; the server checks the bytes again. Phones open the camera or gallery; desktop also takes a
// dropped file. `error` is a message from the parent (nothing chosen, or a file the server refused).
export function ProofPicker({ files, onChange, disabled, error }: { files: File[]; onChange: (files: File[]) => void; disabled: boolean; error?: string }) {
  const { t } = useI18n()
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const touch = useMediaQuery('(pointer: coarse)')
  const shown = problem ?? error

  const add = (incoming: File[]) => {
    const accepted: File[] = []
    let issue: string | null = null
    for (const file of incoming) {
      if (!(PROOF_CONTENT_TYPES as readonly string[]).includes(file.type)) issue = t(messages.fileWrongType, { name: file.name })
      else if (file.size > PROOF_FILE_MAX_BYTES) issue = t(messages.fileTooBig, { name: file.name })
      else accepted.push(file)
    }
    const next = [...files, ...accepted]
    if (next.length > PROOF_FILES_MAX) issue = t(messages.fileTooMany)
    setProblem(issue)
    onChange(next.slice(0, PROOF_FILES_MAX))
  }

  return (
    <div data-field-group className="flex flex-col gap-3">
      <input ref={input} id={id} type="file" multiple accept={PROOF_CONTENT_TYPES.join(',')} className="sr-only" tabIndex={-1} aria-hidden="true"
        onChange={event => { add([...(event.target.files ?? [])]); event.target.value = '' }} />
      {files.length > 0 && (
        <ul aria-label={t(messages.upload)} className="flex flex-col gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {files.map((file, index) => (
              <m.li key={`${file.name}-${file.size}-${file.lastModified}`} {...listRowMotion} className="flex items-center gap-3 rounded-md bg-surface-container p-3">
                <Thumb file={file} />
                <span className="flex min-w-0 flex-1 flex-col leading-snug">
                  <span className="truncate font-semibold">{file.name}</span>
                  <span className="text-label text-on-surface-variant tabular-nums">{formatSize(file.size)}</span>
                </span>
                <button type="button" disabled={disabled} aria-label={t(messages.removeFile, { name: file.name })}
                  onClick={() => { setProblem(null); onChange(files.filter((_, position) => position !== index)) }}
                  className="state-layer pressable flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest disabled:opacity-50">
                  <X aria-hidden="true" className="size-5" />
                </button>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {files.length === 0 ? (
        <button type="button" disabled={disabled} aria-invalid={shown ? true : undefined} aria-describedby={shown ? `${id}-error` : `${id}-hint`}
          onClick={() => input.current?.click()}
          onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); add([...event.dataTransfer.files]) }}
          className={cn('state-layer pressable flex min-h-34 flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed px-4 py-5 text-center',
            dragging ? 'border-primary bg-primary-container' : shown ? 'border-error bg-surface-container-lowest' : 'border-primary/30 bg-surface-container-lowest')}>
          <ImagePlus aria-hidden="true" className="size-7 text-primary" />
          <span className="font-semibold">{t(messages.upload)}</span>
          <span id={`${id}-hint`} className="text-label text-on-surface-variant">{t(touch ? messages.uploadHintTouch : messages.uploadHint)}</span>
        </button>
      ) : files.length < PROOF_FILES_MAX && (
        <button type="button" disabled={disabled} onClick={() => input.current?.click()}
          className="state-layer pressable flex min-h-12 items-center justify-center gap-2 self-start rounded-sm px-3 font-semibold text-primary disabled:opacity-50">
          <Plus aria-hidden="true" className="size-5" />{t(messages.addFile)}
        </button>
      )}
      {shown && <FieldError id={`${id}-error`}>{shown}</FieldError>}
    </div>
  )
}
