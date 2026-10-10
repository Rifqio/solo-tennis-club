import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

type Tone = 'info' | 'warning' | 'error' | 'success'

const toneClasses: Record<Tone, string> = {
  info: 'bg-surface-container text-on-surface',
  // Blocked for a while (a sign-in lock), not broken.
  warning: 'bg-warning-container text-warning',
  error: 'bg-error-container text-on-error-container',
  success: 'bg-secondary-container text-on-secondary-container',
}

interface StatusPanelProps {
  tone: Tone
  // The named operation or problem, read first by screen readers and shown in bold.
  title: string
  children?: ReactNode
  action?: { label: string; onAction: () => void }
  className?: string
}

export function StatusPanel({ tone, title, children, action, className }: StatusPanelProps) {
  const live = tone === 'error' || tone === 'warning' ? { role: 'alert' } : { role: 'status', 'aria-live': 'polite' as const }
  return (
    <div {...live} className={cn('flex flex-col items-start gap-3 rounded-md p-4 text-body break-words', toneClasses[tone], className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-bold">{title}</p>
        {children}
      </div>
      {action && <Button variant={tone === 'error' ? 'outlined' : 'tonal'} onClick={action.onAction}>{action.label}</Button>}
    </div>
  )
}
