export const LANGUAGES = ['id', 'en'] as const
export type Language = (typeof LANGUAGES)[number]
export interface Message { id: string; en: string }
export type MessageVars = Record<string, string | number>
export function isLanguage(value: unknown): value is Language {
  return value === 'id' || value === 'en'
}
