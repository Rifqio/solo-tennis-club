import { describe, expect, it } from 'vitest'
import { formatClubDateLong, formatClubTime, formatIdr, formatRemainingPlaces } from '@/i18n/format'
import { translate } from '@/i18n/i18n-context'

describe('club formatting', () => {
  it('formats whole rupiah with each language grouping', () => {
    const id = formatIdr(150000, 'id')
    expect(id).toContain('150.000')
    expect(id).toContain('Rp')
    expect(id).not.toMatch(/,00/)
    expect(formatIdr(150000, 'en')).toContain('150,000')
  })

  it('rejects fractional rupiah', () => {
    expect(() => formatIdr(1.5, 'id')).toThrow(RangeError)
  })

  it('formats instants as 24-hour WIB time', () => {
    expect(formatClubTime('2026-10-08T11:00:00.000Z')).toBe('18:00')
    expect(formatClubTime('2026-10-08T17:30:00.000Z')).toBe('00:30')
  })

  it('formats the club date in WIB regardless of the process timezone', () => {
    const before = process.env.TZ
    try {
      const id = formatClubDateLong('2026-12-31', 'id')
      expect(id).toContain('31')
      expect(id).toContain('Desember')
      expect(id).toContain('Kamis')
      process.env.TZ = 'America/Los_Angeles'
      expect(formatClubDateLong('2026-12-31', 'id')).toBe(id)
      expect(formatClubDateLong('2026-12-31', 'en')).toContain('December')
    } finally {
      if (before === undefined) delete process.env.TZ
      else process.env.TZ = before
    }
  })

  it('pluralizes remaining places in both languages', () => {
    expect(formatRemainingPlaces(1, 'en')).toBe('1 place remaining')
    expect(formatRemainingPlaces(2, 'en')).toBe('2 places remaining')
    expect(formatRemainingPlaces(0, 'en')).toBe('0 places remaining')
    expect(formatRemainingPlaces(1, 'id')).toBe('Tersisa 1 tempat')
  })
})

describe('translate', () => {
  it('picks the language and fills placeholders, leaving unknown ones visible', () => {
    const message = { id: 'Isi {field}.', en: 'Enter {field}.' }
    expect(translate(message, 'id', { field: 'harga' })).toBe('Isi harga.')
    expect(translate(message, 'en', { field: 'price' })).toBe('Enter price.')
    expect(translate(message, 'en')).toBe('Enter {field}.')
  })
})
