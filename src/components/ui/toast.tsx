import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import { contentSpring, popSpring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { ToastContext } from './use-toast'
import type { ToastOptions } from './use-toast'

// The result of a finished action (G1: "Is it the result of a finished action?"): "Tersimpan", "Budi Santoso
// diarsipkan" with Urungkan. Success only: a failure that needs action is a field error or a notice panel. A screen
// that is itself the result (the booking confirmation, the sign-in screen after signing out) shows no toast.
//
// One at a time; a new one replaces the current one. 4 seconds, or 6 with Urungkan; the timer pauses while the pointer
// is on it or focus is inside it. It never takes focus. The provider sits above the routes, so a toast shown just
// before navigating stays up on the next screen, and nothing is carried in navigation state (so nothing replays on
// reload or Back).

// Phones: the toast sits above whatever is fixed to the bottom of the screen (the dock, a sticky action bar), which
// marks itself with data-bottom-chrome. Only elements in the lower half count, so a side rail never does.
function bottomChromeHeight() {
  let height = 0
  for (const element of document.querySelectorAll<HTMLElement>('[data-bottom-chrome]')) {
    const rect = element.getBoundingClientRect()
    if (rect.height > 0 && rect.top > window.innerHeight / 2) height = Math.max(height, window.innerHeight - rect.top)
  }
  return height
}

// `inset`: classes that keep the toast clear of a side rail on wider screens (the rail's width), so it centres on the
// content column.
interface ToastState extends ToastOptions { id: number }

export function ToastProvider({ children, inset }: { children: ReactNode; inset?: string }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const [bottom, setBottom] = useState(0)
  const [paused, setPaused] = useState(false)
  const next = useRef(0)
  const show = useCallback((options: ToastOptions) => {
    next.current += 1
    setBottom(bottomChromeHeight())
    setPaused(false)
    setToast({ ...options, id: next.current })
  }, [])

  // The screen changes after a save; the toast moves above the new screen's bottom bar once it has rendered.
  useEffect(() => {
    if (!toast) return
    const frame = window.requestAnimationFrame(() => setBottom(bottomChromeHeight()))
    return () => window.cancelAnimationFrame(frame)
  }, [toast])

  useEffect(() => {
    if (!toast || paused) return
    const timer = window.setTimeout(() => setToast(current => current?.id === toast.id ? null : current), toast.undo ? 6000 : 4000)
    return () => window.clearTimeout(timer)
  }, [toast, paused])

  const value = useMemo(() => show, [show])
  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Always in the page, so screen readers hear each toast once, politely. */}
      <div role="status" aria-live="polite" className="sr-only">{toast?.message ?? ''}</div>
      <div className={cn('pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4', inset)}
        style={{ bottom: `calc(${bottom}px + max(1rem, env(safe-area-inset-bottom)))` }}>
        <AnimatePresence>
          {toast && <ToastPill key={toast.id} toast={toast} onDone={() => setToast(null)} onPause={setPaused} />}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastPill({ toast, onDone, onPause }: { toast: ToastState; onDone: () => void; onPause: (paused: boolean) => void }) {
  const still = useReducedMotion()
  return (
    <m.div
      initial={still ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: still ? 0.15 : 0.16 } }}
      transition={still ? { duration: 0.15 } : contentSpring}
      onPointerEnter={() => onPause(true)} onPointerLeave={() => onPause(false)}
      onFocus={() => onPause(true)} onBlur={() => onPause(false)}
      className={cn('pointer-events-auto flex max-w-[28rem] items-center gap-3 rounded-full bg-band-tile text-on-signboard shadow-fab [&_:focus-visible]:outline-white',
        toast.undo ? 'min-h-14 py-1 pl-4 pr-1' : 'min-h-12 px-4 py-2')}>
      <m.span aria-hidden="true" initial={still ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={popSpring}
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
        <Check className="size-3.5" strokeWidth={3} />
      </m.span>
      {/* The live region above reads the message; this copy is for the eyes. */}
      <span aria-hidden="true" className="min-w-0 py-1 font-semibold leading-snug">{toast.message}</span>
      {toast.undo && (
        <button type="button" onClick={() => { toast.undo?.run(); onDone() }} aria-label={`${toast.undo.label}: ${toast.message}`}
          className="pressable min-h-12 shrink-0 rounded-full bg-accent px-5 font-bold text-on-accent">
          {toast.undo.label}
        </button>
      )}
    </m.div>
  )
}
