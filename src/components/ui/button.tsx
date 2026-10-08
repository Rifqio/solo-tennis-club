import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps, MouseEvent } from 'react'
import { cn } from '@/lib/utils'

// 48px targets, 8px radius, labels that wrap and grow instead of truncating. One filled green action per task.
const buttonVariants = cva(
  'inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-center text-body font-bold break-words transition-colors duration-150 aria-disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'border-primary bg-primary text-primary-foreground hover:bg-foreground hover:border-foreground aria-disabled:hover:bg-primary aria-disabled:hover:border-primary',
        secondary: 'border-input bg-background text-foreground hover:bg-secondary aria-disabled:hover:bg-background',
        destructive: 'border-error bg-error text-white hover:bg-foreground hover:border-foreground aria-disabled:hover:bg-error aria-disabled:hover:border-error',
      },
    },
    defaultVariants: { variant: 'secondary' },
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
