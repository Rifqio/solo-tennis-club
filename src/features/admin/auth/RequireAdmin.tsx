import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { StatusPanel } from '@/components/ui/status-panel'
import { commonMessages } from '@/i18n/common.messages'
import { useI18n } from '@/i18n/use-i18n'
import { SignInPage } from './SignInPage'
import { authMessages } from './auth.messages'
import { useAdminAuth } from './use-admin-auth'

export function RequireAdmin() {
  const { state, reload, identity } = useAdminAuth()
  const { t } = useI18n()
  const location = useLocation()
  if (state.status === 'loading') return <div className="page-gutter mx-auto max-w-[50rem] py-6"><StatusPanel tone="info" title={t(authMessages.checking)} /></div>
  if (state.status === 'error') return <div className="page-gutter mx-auto max-w-[50rem] py-6"><StatusPanel tone="error" title={t(authMessages.checkFailed)} action={{ label: t(commonMessages.retry), onAction: reload }} /></div>
  if (state.status === 'signedOut') return <Navigate to="/admin/sign-in" replace state={{ from: location.pathname + location.search, restricted: true }} />
  // Keep the route and mounted outlet on expiry; access is still enforced by the server.
  return <>
    {state.status === 'expired' && <SignInPage expired />}
    <div key={identity} hidden={state.status === 'expired'} inert={state.status === 'expired'}><Outlet /></div>
  </>
}
