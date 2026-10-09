import { useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { DiscardChangesDialog } from '@/components/admin/DiscardChangesDialog'
import { useAdminAuth } from '../auth/use-admin-auth'
import { SIGN_OUT_REQUEST } from './navigation-events'
export function useUnsavedChangesGuard(isDirty: boolean, onDiscard?: () => void, pending = false) {
  const allowNavigation = useRef(false)
  const { state } = useAdminAuth()
  const active = state.status === 'signedIn'
  const [signOutConfirmation, setSignOutConfirmation] = useState(false)
  const signOutAction = useRef<(() => void) | null>(null)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => active && (isDirty || pending) && !allowNavigation.current && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if ((isDirty || pending) && !allowNavigation.current) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, pending])
  useEffect(() => {
    const handler = (event: Event) => {
      if (!active || (!isDirty && !pending) || allowNavigation.current) return
      event.preventDefault()
      signOutAction.current = (event as CustomEvent<() => void>).detail
      setSignOutConfirmation(true)
    }
    window.addEventListener(SIGN_OUT_REQUEST, handler)
    return () => window.removeEventListener(SIGN_OUT_REQUEST, handler)
  }, [active, isDirty, pending])
  const dialog = <DiscardChangesDialog busy={pending} open={blocker.state === 'blocked' || signOutConfirmation} onKeep={() => { setSignOutConfirmation(false); signOutAction.current = null; if (blocker.state === 'blocked') blocker.reset() }} onDiscard={() => {
    if (pending) return
    onDiscard?.()
    if (signOutAction.current) { allowNavigation.current = true; signOutAction.current(); signOutAction.current = null; setSignOutConfirmation(false) }
    if (blocker.state === 'blocked') blocker.proceed()
  }} />
  return { dialog, allowNavigation: () => { allowNavigation.current = true } }
}
