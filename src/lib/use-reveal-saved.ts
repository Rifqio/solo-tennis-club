import { useEffect, useRef } from 'react'

// After a save returns the admin to a list, the saved row comes into view once (the toast says it was saved; this
// shows where). Rows mark themselves with data-row-id. Nothing moves if the row is already on screen or not loaded
// (beyond the first page): the toast alone is then the feedback.
export function useRevealSaved(savedId: string | null | undefined, ready: boolean) {
  const done = useRef<string | null>(null)
  useEffect(() => {
    if (!savedId || !ready || done.current === savedId) return
    done.current = savedId
    const row = document.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(savedId)}"]`)
    if (!row) return
    const rect = row.getBoundingClientRect()
    if (rect.top >= 0 && rect.bottom <= window.innerHeight) return
    row.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [savedId, ready])
}
