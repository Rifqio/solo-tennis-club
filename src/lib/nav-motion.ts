// How a page change moves, chosen from where a link goes relative to where the visitor is (DESIGN.md, Motion):
// deeper is a push (new screen slides in from the right), shallower is a pop (it slides back), same depth is a
// section switch (a quick crossfade). index.css reads the choice from <html data-nav> during the view transition.
// Picking a row inside a desktop split view never runs a view transition, so it stays instant.

function depthOf(pathname: string) {
  return pathname.split('/').filter(Boolean).length
}

export function navMotionFor(from: string, to: string): 'push' | 'pop' | 'tab' {
  const delta = depthOf(to) - depthOf(from)
  return delta > 0 ? 'push' : delta < 0 ? 'pop' : 'tab'
}

let clear = 0

// Listens in the capture phase so the direction is set before React Router starts the view transition.
export function installNavMotion() {
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!link || link.target === '_blank' || link.origin !== window.location.origin) return
    document.documentElement.dataset.nav = navMotionFor(window.location.pathname, link.pathname)
    window.clearTimeout(clear)
    clear = window.setTimeout(() => { delete document.documentElement.dataset.nav }, 800)
  }, { capture: true })
}
