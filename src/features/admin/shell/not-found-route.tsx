import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusPanel } from '@/components/ui/status-panel'
import { useI18n } from '@/i18n/use-i18n'

export function Component() {
  const { t } = useI18n()
  return <div className="page-gutter mx-auto max-w-[50rem] py-6"><StatusPanel tone="info" title={t({ id: 'Halaman admin tidak tersedia.', en: 'This admin page is unavailable.' })}>
    <Button asChild><Link to="/admin/sessions" aria-label={t({ id: 'Kembali ke sesi', en: 'Back to sessions' })}><ArrowLeft aria-hidden="true" className="size-5" />{t({ id: 'Sesi', en: 'Sessions' })}</Link></Button>
  </StatusPanel></div>
}
