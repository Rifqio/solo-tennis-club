// How a page change moves, chosen from where a link goes relative to where the visitor is (DESIGN.md, Motion):
// deeper is a push (new screen slides in from the right), shallower is a pop (it slides back), same depth is a
// section switch (a quick crossfade). index.css reads the choice from <html data-nav> during the view transition.
// A link can say its own motion with data-nav when depth gets it wrong: the dock and rail are always a section switch
// ("tab"), and a sibling screen that is really a step deeper or back says "push" or "pop". Picking a row inside a
// desktop split view, or a tab inside one screen, never runs a view transition, so it stays instant.

function depthOf(pathname: string) {
  return pathname.split('/').filter(Boolean).length
}

export function navMotionFor(from: string, to: string): 'push' | 'pop' | 'tab' {
  const delta = depthOf(to) - depthOf(from)
  return delta > 0 ? 'push' : delta < 0 ? 'pop' : 'tab'
}

let clear = 0

// For a navigation started from code (after a save, a sign-in redirect): call before navigate(…, { viewTransition: true }).
export function setNavMotion(motion: 'push' | 'pop' | 'tab') {
  document.documentElement.dataset.nav = motion
  window.clearTimeout(clear)
  clear = window.setTimeout(() => { delete document.documentElement.dataset.nav }, 800)
}

// Listens in the capture phase so the direction is set before React Router starts the view transition.
export function installNavMotion() {
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!link || link.target === '_blank' || link.origin !== window.location.origin) return
    const own = link.dataset.nav
    setNavMotion(own === 'push' || own === 'pop' || own === 'tab' ? own : navMotionFor(window.location.pathname, link.pathname))
  }, { capture: true })
}
