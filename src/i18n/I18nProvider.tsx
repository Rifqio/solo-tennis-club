import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { I18nContext, translate } from './i18n-context'
import { isLanguage } from './types'
import type { Language, Message, MessageVars } from './types'

export const LANGUAGE_STORAGE_KEY = 'lafu.language'

// D-13: Indonesian on the first visit, never the browser language.
function readStoredLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguage(stored) ? stored : 'id'
  } catch {
    return 'id'
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(readStoredLanguage)

  useEffect(() => { document.documentElement.lang = language }, [language])

  const setLanguage = (next: Language) => {
    setLanguageState(next)
    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next) } catch { /* Private browsing can block storage; the choice still applies to this visit. */ }
  }
  const t = (message: Message, vars?: MessageVars) => translate(message, language, vars)

  return <I18nContext value={{ language, setLanguage, t }}>{children}</I18nContext>
}
