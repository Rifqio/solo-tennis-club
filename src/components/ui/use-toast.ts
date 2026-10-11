import { createContext, useContext } from 'react'

// Shows a toast (src/components/ui/toast.tsx): the result of a finished action, success only.
export interface ToastOptions {
  message: string
  undo?: { label: string; run: () => void }
}

export const ToastContext = createContext<((options: ToastOptions) => void) | null>(null)

export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast needs a ToastProvider')
  return show
}
