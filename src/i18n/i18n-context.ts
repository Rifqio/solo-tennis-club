import { createContext } from 'react'
import type { Language, Message, MessageVars } from './types'

export interface I18nContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (message: Message, vars?: MessageVars) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export function translate(message: Message, language: Language, vars?: MessageVars) {
  const text = message[language]
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
}
