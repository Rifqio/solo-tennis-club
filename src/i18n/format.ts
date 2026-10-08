import { CLUB_TIME_ZONE, clubDateTimeToInstant } from '@shared/club-time'
import type { Language } from './types'

const LOCALE: Record<Language, string> = { id: 'id-ID', en: 'en-GB' }

const longDateFormats = {
  id: new Intl.DateTimeFormat(LOCALE.id, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: CLUB_TIME_ZONE }),
  en: new Intl.DateTimeFormat(LOCALE.en, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: CLUB_TIME_ZONE }),
}
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: CLUB_TIME_ZONE })
const idrFormats = {
  id: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }),
  // en-ID groups digits the Indonesian way; en-GB with the narrow symbol gives English readers "Rp 150,000".
  en: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'IDR', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }),
}
const englishPlural = new Intl.PluralRules('en')

export function formatClubDateLong(date: string, language: Language) {
  return longDateFormats[language].format(clubDateTimeToInstant(date, '12:00'))
}

export function formatClubTime(isoInstant: string) {
  return timeFormat.format(new Date(isoInstant))
}

export function formatIdr(amount: number, language: Language) {
  if (!Number.isSafeInteger(amount)) throw new RangeError('IDR amounts are whole rupiah')
  return idrFormats[language].format(amount)
}

export function formatRemainingPlaces(count: number, language: Language) {
  if (language === 'id') return `Tersisa ${count} tempat`
  return englishPlural.select(count) === 'one' ? `${count} place remaining` : `${count} places remaining`
}
