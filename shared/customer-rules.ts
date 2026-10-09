import { parsePhoneNumberFromString } from 'libphonenumber-js/max'

export function normalizeCustomerPhone(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed.length > 50 || !/^[+\d\s().-]+$/.test(trimmed)) return null
  const phone = parsePhoneNumberFromString(trimmed, { defaultCountry: 'ID', extract: false })
  if (!phone?.isValid() || phone.ext) return null
  return phone.number
}

export function normalizeCustomerName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, ' ')
  if (!name || name.length > 120 || [...name].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return null
  return name
}
