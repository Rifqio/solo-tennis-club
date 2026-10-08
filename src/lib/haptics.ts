// Selection tick: a very short vibration when a choice changes (day, tab, language), like a native selection haptic.
// Android browsers honor it; iOS Safari ignores navigator.vibrate, which is the right silent fallback.
// Only on touch devices, and never when the visitor asks for reduced motion.
export function selectionHaptic() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  if (!window.matchMedia('(pointer: coarse)').matches) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  try { navigator.vibrate(8) } catch { /* Some browsers block vibration until a user gesture; nothing to recover. */ }
}
