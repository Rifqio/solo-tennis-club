import { useEffect, useState } from 'react'

// Wall-clock time that advances once a minute, so "next" and "starts in" labels stay true while the screen is open.
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
