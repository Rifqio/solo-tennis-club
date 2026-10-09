import { useRef, useState } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LanguageMenu } from '@/components/ui/language-switch'
import { StatusPanel } from '@/components/ui/status-panel'
import { apiErrorMessages } from '@/i18n/api-error-messages'
import { useI18n } from '@/i18n/use-i18n'
import { authMessages } from '../auth/auth.messages'
import { useAdminAuth } from '../auth/use-admin-auth'
import { adminNavItems } from './admin-nav'
import { shellMessages } from './shell.messages'
import { cn } from '@/lib/utils'
import { requestSignOut } from '../forms/navigation-events'

export function AdminLayout() {
  const { t } = useI18n()
  const { signOut } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const sending = useRef(false)
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
  return <div className="min-h-dvh bg-surface text-on-surface">
    <header className="sticky top-0 z-30 bg-signboard pt-[env(safe-area-inset-top)] text-on-signboard [&_:focus-visible]:outline-white">
      <div className="page-gutter mx-auto flex min-h-16 max-w-[72rem] flex-wrap items-center justify-between gap-2 py-2 sm:pl-24">
        <p className="flex items-baseline gap-2"><span className="font-display text-headline font-bold uppercase">LAFU</span><span className="text-label text-on-signboard-variant">{t(shellMessages.admin)}</span></p>
        <div className="flex flex-wrap items-center gap-2"><LanguageMenu /><Button variant="text" className="px-3 text-on-signboard" onClick={() => requestSignOut(() => void leave())} disabled={pending} pendingLabel={pending ? t(authMessages.signingOut) : undefined}>{t(authMessages.signOut)}</Button></div>
      </div>
    </header>
    <main className="pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)] sm:pb-8 sm:pl-20">
      {failure && <div className="page-gutter mx-auto max-w-[50rem] pt-4"><StatusPanel tone="error" title={failure} action={{ label: t(authMessages.signOut), onAction: () => void leave() }} /></div>}
      <m.div key={location.pathname} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.2, 0, 0, 1] }}><Outlet /></m.div>
    </main>
    <nav aria-label={t(shellMessages.navLabel)} className="fixed inset-x-0 bottom-0 z-30 flex bg-surface-container pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:left-0 sm:top-[calc(4rem+env(safe-area-inset-top))] sm:w-20 sm:flex-col sm:items-center sm:pb-0 sm:pt-4">
      {adminNavItems.map(({ to, label, Icon }) => {
        const isActive = location.pathname === to || location.pathname.startsWith(to + '/') || (to === '/admin/manage' && ['/admin/coaches', '/admin/venues', '/admin/levels'].some(path => location.pathname === path || location.pathname.startsWith(path + '/')))
        return <Link key={to} to={to} aria-current={isActive ? 'page' : undefined} className="group flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 sm:flex-none">
          <span className={cn('state-layer pressable flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-200', isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant')}><Icon aria-hidden="true" className="size-6" /></span><span className={cn('text-center text-label', isActive ? 'font-bold' : 'text-on-surface-variant')}>{t(label)}</span>
        </Link>
      })}
    </nav>
  </div>
}
