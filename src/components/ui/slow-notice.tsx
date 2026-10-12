import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import { commonMessages } from '@/i18n/common.messages'

const copy = {
  member: { id: 'Masih memuat. Koneksinya lagi lambat.', en: 'Still loading. The connection is slow.' },
  admin: { id: 'Masih memuat. Koneksi sedang lambat.', en: 'Still loading. The connection is slow.' },
}

// G3: a load that is still going after five seconds gets one quiet line under its placeholder, with Coba lagi as a
// text button. Before then nothing is said, so a normal load never mentions the connection.
export function SlowNotice({ after = 5000, onRetry, voice = 'member' }: { after?: number; onRetry?: () => void; voice?: 'member' | 'admin' }) {
  const { t } = useI18n()
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), after)
    return () => window.clearTimeout(timer)
  }, [after])
  if (!slow) return null
  return (
    <p role="status" className="notice-in flex min-h-12 items-center justify-between gap-3 text-label text-on-surface-variant">
      {t(copy[voice])}
      {onRetry && (
        <button type="button" onClick={onRetry} className="state-layer -mr-3 inline-flex min-h-12 shrink-0 items-center rounded-sm px-3 font-semibold text-primary">
          {t(commonMessages.retry)}
        </button>
      )}
    </p>
  )
}
