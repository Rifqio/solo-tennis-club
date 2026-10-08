import { useI18n } from '@/i18n/use-i18n'
import { scheduleMessages } from './schedule.messages'

// Shown once above the list whenever any session is labeled test data, so fixtures are never mistaken for the club schedule.
export function SampleDataNotice() {
  const { t } = useI18n()
  return <p className="rounded-sm bg-warning-container px-4 py-3 text-label font-bold text-warning">{t(scheduleMessages.sampleData)}</p>
}
