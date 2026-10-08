import { describe, expect, it } from 'vitest'
import { apiErrorMessages, fieldErrorMessage, fieldErrorMessages } from '@/i18n/api-error-messages'

// Exhaustiveness over the shared unions is enforced by the Record types at build time; this checks the copy itself.
describe('localized error catalog', () => {
  it.each([...Object.entries(apiErrorMessages), ...Object.entries(fieldErrorMessages)])('%s has Indonesian and English copy', (_code, message) => {
    expect(message.id.trim()).not.toBe('')
    expect(message.en.trim()).not.toBe('')
    expect(message.id).not.toBe(message.en)
    expect(message.id + message.en).not.toContain('—')
  })

  it('uses the UI-SPEC copy where the contract defines it', () => {
    expect(apiErrorMessages.SIGN_IN_FAILED).toEqual({ id: 'Email atau kata sandi tidak cocok. Periksa lalu coba lagi.', en: 'Email or password does not match. Check and try again.' })
    expect(apiErrorMessages.STALE_VERSION.en).toBe('Another admin changed this session. Load the latest version and review your changes.')
    expect(apiErrorMessages.SIGN_IN_THROTTLED.en).toContain('{minutes}')
    expect(apiErrorMessages.UNAUTHENTICATED.id).toBe('Sesi admin berakhir. Masuk lagi untuk melanjutkan.')
    expect(fieldErrorMessages.MIN_EXCEEDS_MAX.en).toBe('Minimum participants cannot exceed maximum capacity.')
    expect(fieldErrorMessages.CAPACITY_BELOW_OCCUPIED.id).toBe('Kapasitas lebih kecil dari tempat yang sudah terpakai. Tambahkan kapasitas lalu simpan lagi.')
    expect(fieldErrorMessages.COACH_REQUIRED).toEqual({ id: 'Pilih setidaknya satu pelatih.', en: 'Select at least one coach.' })
    expect(fieldErrorMessages.REQUIRED).toEqual({ id: 'Isi {field}.', en: 'Enter {field}.' })
  })

  it('gives price the specific rupiah message and other integers the generic one', () => {
    expect(fieldErrorMessage('priceIdr', 'INVALID_INTEGER').en).toBe('Enter a valid whole-number rupiah price.')
    expect(fieldErrorMessage('maxParticipants', 'INVALID_INTEGER')).toBe(fieldErrorMessages.INVALID_INTEGER)
  })
})
