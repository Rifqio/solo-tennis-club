// After a submit that found problems (G1: field error): focus moves to the first invalid field and every invalid field
// shakes once, 8px over 420ms. Only on submit, never while typing; with reduced motion there is no shake. Fields mark
// their outer box with data-field-group (fieldsets use data-field), which is what shakes.
const shake: Keyframe[] = [
  { transform: 'translateX(0)' }, { transform: 'translateX(-8px)', offset: 0.2 }, { transform: 'translateX(7px)', offset: 0.4 },
  { transform: 'translateX(-5px)', offset: 0.6 }, { transform: 'translateX(3px)', offset: 0.8 }, { transform: 'translateX(0)' },
]

export function revealInvalid(root: ParentNode | null | undefined = document) {
  requestAnimationFrame(() => {
    const invalid = [...(root ?? document).querySelectorAll<HTMLElement>('[aria-invalid=true]')]
    invalid[0]?.focus()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const boxes = new Set(invalid.map(element => element.closest<HTMLElement>('[data-field-group], [data-field]') ?? element))
    for (const box of boxes) box.animate?.(shake, { duration: 420, easing: 'cubic-bezier(.36,.07,.19,.97)' })
  })
}
