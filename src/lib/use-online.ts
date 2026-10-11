import { useSyncExternalStore } from 'react'

// Whether the browser says it is online; follows the online and offline events.
const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => { window.removeEventListener('online', onChange); window.removeEventListener('offline', onChange) }
}

export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
}
