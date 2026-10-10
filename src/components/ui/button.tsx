import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps, MouseEvent } from 'react'
import { cn } from '@/lib/utils'

// Courtside buttons: 8px corners (square-ish, after the padel reference), 48px touch height, label wraps instead of truncating.
// Filled is the one primary action per region (ink with lime text on light, lime with ink on dark); accent is the lime
// form for use on the court band or ink surfaces; tonal and outlined are secondary; text is lowest emphasis.
const buttonVariants = cva(
  'state-layer pressable inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-sm px-6 py-2 text-center text-body font-semibold break-words transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        filled: 'bg-cta text-on-cta',
        accent: 'bg-accent text-on-accent',
        tonal: 'bg-primary-container text-primary',
        outlined: 'border border-outline bg-transparent text-on-surface',
        text: 'bg-transparent px-3 text-primary',
        destructive: 'bg-error text-on-error',
      },
    },
    defaultVariants: { variant: 'tonal' },
  },
)

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants> & {
  asChild?: boolean
  // While set, the button names the running operation and ignores further presses (no spinner).
  pendingLabel?: string
}

export function Button({ className, variant, asChild = false, pendingLabel, children, onClick, type = 'button', ...props }: ButtonProps) {
  const pending = pendingLabel !== undefined
  const classes = cn(buttonVariants({ variant }), className)
  if (asChild) return <Slot.Root className={classes} {...props}>{children}</Slot.Root>
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (pending) { event.preventDefault(); return }
    onClick?.(event)
  }
  return (
    <button type={type} className={classes} aria-disabled={pending || undefined} onClick={handleClick} {...props}>
      {pending ? pendingLabel : children}
    </button>
  )
}

// Standard 48px icon button. The accessible name is required because the glyph alone is not a label.
export function IconButton({ label, className, children, ...props }: Omit<ComponentProps<'button'>, 'aria-label'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      data-icon-only
      className={cn('state-layer pressable inline-flex size-12 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40', className)}
      {...props}
    >
      {children}
    </button>
  )
}
