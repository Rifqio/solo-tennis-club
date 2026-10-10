import { useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { StatusPanel } from '@/components/ui/status-panel'
import { useMediaQuery } from '@/lib/use-media-query'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { useI18n } from '@/i18n/use-i18n'
import { authMessages } from '../auth/auth.messages'
import { useAdminAuth } from '../auth/use-admin-auth'
import { requestSignOut } from '../forms/navigation-events'
import { AdminDock } from './AdminDock'
import { AdminShellContext } from './admin-shell-context'
import { isAdminTabScreen } from './admin-nav'

// Each admin screen draws its own band (AdminBand). The layout owns sign-out and the dock (bottom bar on phones, left
// rail from 640px).
export function AdminLayout() {
  const { t } = useI18n()
  const { signOut } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const sending = useRef(false)
  const tabScreen = isAdminTabScreen(location.pathname)
  // Phones hide the bottom dock on focused screens (forms, roster, booking detail), which carry their own bottom
  // action. From 640px the dock is a left rail that clashes with nothing, so it stays on every admin screen.
  const wide = useMediaQuery('(min-width: 40rem)')
  const showDock = tabScreen || wide
  const shell = useMemo(() => {
    const leave = async () => {
      if (sending.current) return
      sending.current = true
      setPending(true)
      setFailure(null)
      try {
        const result = await signOut()
        if (result.kind === 'ok' || (result.kind === 'http' && result.status === 401)) navigate('/admin/sign-in', { replace: true })
        else setFailure(result.kind === 'http' ? t(apiErrorMessages[result.code] ?? apiErrorMessages.INTERNAL) : t(authMessages.signOutFailed))
      } finally { sending.current = false; setPending(false) }
    }
    return { signOut: () => requestSignOut(() => void leave()), signingOut: pending }
  }, [signOut, navigate, t, pending])

  return <AdminShellContext.Provider value={shell}>
    <div className="min-h-dvh bg-surface text-on-surface">
      <main className={showDock ? 'overflow-x-clip pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-12 sm:pl-20 lg:pl-24' : 'overflow-x-clip'}>
        {failure && <div className="page-gutter mx-auto max-w-[50rem] pt-4"><StatusPanel tone="error" title={failure} action={{ label: t(authMessages.signOut), onAction: shell.signOut }} /></div>}
        {/* No page fade here: page changes move through view transitions by direction (src/lib/nav-motion.ts). */}
        <Outlet />
      </main>
      {showDock && <AdminDock />}
    </div>
  </AdminShellContext.Provider>
}
