import { use } from 'react'
import { I18nContext } from './i18n-context'

export function useI18n() {
  const value = use(I18nContext)
  if (value === null) throw new Error('useI18n must be used inside I18nProvider')
  return value
}
