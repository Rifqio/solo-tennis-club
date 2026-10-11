import type { ReactNode } from 'react'
import { Check, CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

type Tone = 'info' | 'warning' | 'error' | 'success'

// The four states of the status and feedback guideline (G1). Colour always comes with an icon and words, so a state
// reads without colour; STC has no green, so success is Deep Court with a lime check.
// - info: something worth knowing, nothing is wrong.
// - success: the person's own action worked (usually a toast instead, src/components/ui/toast.tsx).
// - warning: nothing failed yet, but it will if ignored (a payment deadline, a sign-in lock).
// - error: something failed and needs action.
const tones: Record<Tone, { panel: string; title: string; button: 'outlined' | 'tonal' }> = {
  info: { panel: 'bg-primary-container text-on-primary-container', title: '', button: 'tonal' },
  success: { panel: 'bg-band-tile text-on-signboard [&_:focus-visible]:outline-white', title: '', button: 'tonal' },
  warning: { panel: 'bg-warning-container text-warning', title: '', button: 'tonal' },
  error: { panel: 'bg-error-container text-on-error-container', title: 'text-error', button: 'outlined' },
}

function ToneIcon({ tone }: { tone: Tone }) {
  if (tone === 'success') {
    return <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"><Check className="size-4" strokeWidth={3} /></span>
  }
  const Icon = tone === 'info' ? Info : tone === 'warning' ? TriangleAlert : CircleAlert
  return <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', tone === 'info' ? 'text-primary' : tone === 'error' ? 'text-error' : undefined)} strokeWidth={2.25} />
}

interface StatusPanelProps {
  tone: Tone
  // What happened, read first by screen readers and shown in bold. Then, in the children, what to do.
  title: string
  children?: ReactNode
  action?: { label: string; onAction: () => void }
  className?: string
}

// A notice inside the card or form it is about (G1: "Is one card or form affected?"). It fades in where it belongs and
// never covers content. Errors and warnings are announced at once; information and success politely.
export function StatusPanel({ tone, title, children, action, className }: StatusPanelProps) {
  const live = tone === 'error' || tone === 'warning' ? { role: 'alert' } : { role: 'status', 'aria-live': 'polite' as const }
  const style = tones[tone]
  return (
    <div {...live} className={cn('notice-in flex flex-col items-start gap-3 rounded-md p-4 text-body break-words', style.panel, className)}>
      <div className="flex min-w-0 gap-3">
        <ToneIcon tone={tone} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className={cn('font-bold', style.title)}>{title}</p>
          {children}
        </div>
      </div>
      {action && <Button variant={style.button} onClick={action.onAction} className="ml-10">{action.label}</Button>}
    </div>
  )
}
