import { NavLink, Outlet } from 'react-router-dom'
import { LanguageSwitch } from '@/components/ui/language-switch'
import { useI18n } from '@/i18n/use-i18n'
import { cn } from '@/lib/utils'
import { clubContent } from '../club/club-content'
import { publicMessages } from './public.messages'

const navLinkClass = ({ isActive }: { isActive: boolean }) => cn(
  'inline-flex min-h-12 items-center border-b-4 px-3 pt-1 text-body font-bold transition-colors duration-150 hover:text-primary',
  isActive ? 'border-primary text-primary' : 'border-transparent text-foreground',
)

export function PublicLayout() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-svh flex-col">
      <header className="pt-[env(safe-area-inset-top)]">
        <div className="page-gutter mx-auto flex w-full max-w-[70rem] flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
          {/* Text identity until the club supplies a logo (R-23); no image is invented. */}
          <p className="flex min-w-0 flex-col">
            <span className="text-display font-bold leading-none text-foreground">{clubContent.shortName}</span>
            <span className="mt-1 text-label text-muted-foreground">{clubContent.name}</span>
          </p>
          <LanguageSwitch className="w-full sm:w-auto sm:min-w-[20rem]" />
        </div>
        <nav aria-label={t(publicMessages.navLabel)} className="bg-secondary">
          <ul className="page-gutter mx-auto flex w-full max-w-[70rem] flex-wrap gap-x-2">
            <li><NavLink to="/" end className={navLinkClass}>{t(publicMessages.schedule)}</NavLink></li>
            <li><NavLink to="/club" className={navLinkClass}>{t(publicMessages.about)}</NavLink></li>
          </ul>
        </nav>
      </header>
      <main className="flex-1 pb-[max(24px,env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
    </div>
  )
}
