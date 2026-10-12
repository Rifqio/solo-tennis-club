import { useEffect, useRef } from 'react'
import { useI18n } from '@/i18n/use-i18n'
import { commonMessages } from '@/i18n/common.messages'
import { useOnline } from '@/lib/use-online'
import { Button } from './button'
import { EmptyState } from './empty-state'

const copy = {
  member: {
    body: { id: 'Cek koneksi kamu, lalu coba lagi.', en: 'Check your connection, then try again.' },
    offlineTitle: { id: 'Koneksi terputus', en: 'You are offline' },
    offlineBody: { id: 'Halaman ini dimuat lagi begitu kamu tersambung.', en: 'This page loads again as soon as you are back online.' },
  },
  admin: {
    body: { id: 'Periksa koneksi, lalu coba lagi.', en: 'Check the connection, then try again.' },
    offlineTitle: { id: 'Koneksi terputus', en: 'You are offline' },
    offlineBody: { id: 'Halaman ini dimuat ulang setelah tersambung.', en: 'This page reloads once the connection is back.' },
  },
}

// A screen whose data did not load (G3). Online, it is the ball in the net: the title names what failed, one action,
// Coba lagi. Offline, it is the court with the lights off, and the load runs again by itself when the connection
// returns, so nobody has to tap. Use it only when the screen has nothing to show; a screen that already has data
// keeps it under the connection banner.
export function LoadFailed({ title, onRetry, voice = 'member', className }: {
  title: string
  onRetry: () => void
  voice?: 'member' | 'admin'
  className?: string
}) {
  const { t } = useI18n()
  const online = useOnline()
  const words = copy[voice]
  const retry = useRef(onRetry)
  useEffect(() => { retry.current = onRetry })
  const wasOffline = useRef(!online)
  useEffect(() => {
    if (!online) { wasOffline.current = true; return }
    if (wasOffline.current) { wasOffline.current = false; retry.current() }
  }, [online])

  const action = <Button variant="filled" onClick={onRetry}>{t(commonMessages.retry)}</Button>
  return online
    ? <EmptyState scene="load-error" title={title} body={t(words.body)} action={action} className={className} />
    : <EmptyState scene="offline" title={t(words.offlineTitle)} body={t(words.offlineBody)} action={action} className={className} />
}
