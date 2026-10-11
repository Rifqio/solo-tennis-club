import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { WifiOff } from 'lucide-react'
import { useI18n } from '@/i18n/use-i18n'
import { useOnline } from '@/lib/use-online'
import { cn } from '@/lib/utils'

const copy = {
  title: { id: 'Koneksi terputus.', en: 'You are offline.' },
  member: { id: 'Cek internet kamu. Yang belum terkirim bisa dicoba lagi setelah tersambung.', en: 'Check your internet. Anything not sent yet can be tried again once you are back online.' },
  admin: { id: 'Periksa koneksi internet. Perubahan yang belum tersimpan dapat dicoba lagi setelah tersambung.', en: 'Check the internet connection. Unsaved changes can be tried again once you are back online.' },
}

// A lasting system state (G1: banner): under the blue band, as wide as the content column, pushing content down
// rather than covering it. It stays until the connection is back. One banner at most; this is the only one so far.
// `voice`: members get casual Indonesian, admin screens formal.
export function ConnectionBanner({ voice, className }: { voice: 'member' | 'admin'; className?: string }) {
  const { t } = useI18n()
  const online = useOnline()
  const still = useReducedMotion()
  return (
    <AnimatePresence initial={false}>
      {!online && (
        <m.div key="offline" role="alert"
          initial={still ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          exit={still ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          className={cn('overflow-hidden', className)}>
          <div className="mt-3 flex items-start gap-2.5 rounded-md bg-warning-container px-4 py-3 text-warning">
            <WifiOff aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={2.25} />
            <p className="min-w-0"><span className="font-bold">{t(copy.title)}</span> {t(copy[voice])}</p>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
