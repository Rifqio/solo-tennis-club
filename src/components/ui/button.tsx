import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps, MouseEvent } from 'react'
import { cn } from '@/lib/utils'

// Material 3 common buttons: full-round, 48px touch height, label wraps instead of truncating.
// Filled is the one primary action per screen; tonal and outlined are secondary; text is lowest emphasis.
const buttonVariants = cva(
  'state-layer inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-full px-6 py-2 text-center text-body font-bold break-words transition-colors duration-150 aria-disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        filled: 'bg-primary text-on-primary',
        tonal: 'bg-secondary-container text-on-secondary-container',
        outlined: 'border border-outline bg-transparent text-primary',
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
      className={cn('state-layer inline-flex size-12 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40', className)}
      {...props}
    >
      {children}
    </button>
  )
}
