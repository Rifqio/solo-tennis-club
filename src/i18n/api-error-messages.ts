import type { ApiErrorCode, FieldErrorCode } from '@shared/api/errors'
import type { Message } from './types'

// Records keyed by the shared unions: adding a code on the server fails the build until it has copy here.
export const apiErrorMessages: Record<ApiErrorCode, Message> = {
  CUSTOMER_UNAUTHENTICATED: { id: 'Sesi Anda berakhir. Masuk lagi untuk melanjutkan.', en: 'Your session has ended. Sign in again to continue.' },
  OTP_INVALID: { id: 'Kode tidak cocok. Periksa enam digit lalu coba lagi.', en: 'The code does not match. Check all six digits and try again.' },
  OTP_EXPIRED: { id: 'Kode sudah kedaluwarsa. Minta kode baru.', en: 'The code has expired. Request a new code.' },
  OTP_CONSUMED: { id: 'Kode sudah digunakan atau diganti. Minta kode baru.', en: 'This code was used or replaced. Request a new code.' },
  OTP_THROTTLED: { id: 'Terlalu banyak percobaan. Tunggu {seconds} detik lalu coba lagi.', en: 'Too many attempts. Wait {seconds} seconds and try again.' },
  TEMPORARILY_UNAVAILABLE: { id: 'Layanan belum tersedia. Coba lagi nanti atau hubungi klub.', en: 'This service is unavailable. Try again later or contact the club.' },
  NOT_FOUND: { id: 'Data tidak ditemukan. Muat ulang halaman.', en: 'This item could not be found. Reload the page.' },
  INTERNAL: { id: 'Terjadi kendala di server. Coba lagi.', en: 'Something went wrong on the server. Try again.' },
  INVALID_DATE: { id: 'Tanggal tidak valid. Pilih tanggal lain.', en: 'That date is not valid. Choose another date.' },
  DATE_OUT_OF_RANGE: { id: 'Tanggal ini di luar jangkauan jadwal. Pilih tanggal lain.', en: 'This date is outside the schedule range. Choose another date.' },
  UNAUTHENTICATED: { id: 'Sesi admin berakhir. Masuk lagi untuk melanjutkan.', en: 'Your admin session has ended. Sign in again to continue.' },
  CSRF_FAILED: { id: 'Permintaan tidak dapat diverifikasi. Muat ulang halaman lalu coba lagi.', en: 'The request could not be verified. Reload the page and try again.' },
  ORIGIN_REJECTED: { id: 'Permintaan ditolak. Buka STC dari alamat biasanya lalu coba lagi.', en: 'The request was refused. Open STC from its usual address and try again.' },
  UNSUPPORTED_MEDIA_TYPE: { id: 'Format permintaan tidak didukung. Muat ulang halaman lalu coba lagi.', en: 'The request format is not supported. Reload the page and try again.' },
  PAYLOAD_TOO_LARGE: { id: 'Data yang dikirim terlalu besar. Persingkat isian lalu coba lagi.', en: 'The submitted data is too large. Shorten your entries and try again.' },
  SIGN_IN_FAILED: { id: 'Email atau kata sandi tidak cocok. Periksa lalu coba lagi.', en: 'Email or password does not match. Check and try again.' },
  SIGN_IN_THROTTLED: { id: 'Terlalu banyak percobaan masuk. Coba lagi dalam {minutes} menit.', en: 'Too many sign-in attempts. Try again in {minutes} minutes.' },
  VALIDATION_FAILED: { id: 'Periksa isian yang ditandai, lalu coba lagi.', en: 'Check the highlighted entries and try again.' },
  STALE_VERSION: { id: 'Admin lain baru mengubah data ini. Muat versi terbaru, lalu periksa perubahan Anda.', en: 'Another admin just changed this. Load the latest version, then review your changes.' },
  DUPLICATE_NAME: { id: 'Nama ini sudah digunakan. Gunakan nama lain.', en: 'This name is already in use. Use a different name.' },
  CAPACITY_UNAVAILABLE: { id: 'Slot yang tersisa berubah. Kurangi jumlah peserta lalu coba lagi.', en: 'Availability changed. Reduce the group size and try again.' },
  BOOKING_CLOSED: { id: 'Pemesanan untuk sesi ini sudah ditutup.', en: 'Reservations for this session are closed.' },
  SESSION_CHANGED: { id: 'Detail sesi berubah. Muat ulang sebelum mengonfirmasi.', en: 'Session details changed. Reload before confirming.' },
  IDEMPOTENCY_CONFLICT: { id: 'Permintaan ini sudah dipakai untuk data berbeda. Muat ulang dan coba lagi.', en: 'This request was already used for different details. Reload and try again.' },
  MAP_LINK_UNREADABLE: { id: 'Link ini nggak kebaca. Salin ulang dari tombol Bagikan di Google Maps.', en: "We couldn't read this link. Copy it again from Share in Google Maps." },
  BOOKING_ALREADY_LINKED: { id: 'Booking ini sudah terhubung ke akun lain. Kepemilikannya nggak bisa dipindah dari sini.', en: 'This booking is already linked to another account. Ownership cannot be moved from here.' },
  CUSTOMER_MISMATCH: { id: 'Nomor akun ini beda dengan nomor di booking. Booking hanya bisa dihubungkan ke nomor yang sama persis.', en: "This account's number differs from the booking's number. A booking can only be linked to the exact same number." },
}

export const fieldErrorMessages: Record<FieldErrorCode, Message> = {
  REQUIRED: { id: 'Isi {field}.', en: 'Enter {field}.' },
  INVALID_FORMAT: { id: 'Format {field} tidak valid.', en: 'Enter {field} in a valid format.' },
  INVALID_INTEGER: { id: 'Masukkan {field} berupa angka bulat yang valid.', en: 'Enter {field} as a valid whole number.' },
  OUT_OF_RANGE: { id: '{field} di luar batas yang diizinkan.', en: '{field} is outside the allowed range.' },
  TOO_LONG: { id: '{field} terlalu panjang. Persingkat lalu coba lagi.', en: '{field} is too long. Shorten it and try again.' },
  MIN_EXCEEDS_MAX: { id: 'Minimum peserta tidak boleh melebihi kapasitas maksimum.', en: 'Minimum participants cannot exceed maximum capacity.' },
  CAPACITY_BELOW_OCCUPIED: { id: 'Kapasitas lebih kecil dari slot yang sudah terpakai. Tambahkan kapasitas lalu simpan lagi.', en: 'Capacity is below the slots already taken. Increase capacity and save again.' },
  COACH_REQUIRED: { id: 'Pilih setidaknya satu coach.', en: 'Select at least one coach.' },
  COACH_DUPLICATE: { id: 'Setiap coach hanya dapat dipilih sekali.', en: 'Each coach can be selected only once.' },
  REFERENCE_NOT_FOUND: { id: 'Data yang dipilih tidak lagi tersedia. Pilih yang lain.', en: 'The selected record is no longer available. Choose another one.' },
  DATE_IN_PAST: { id: 'Pilih tanggal dan waktu yang belum lewat.', en: 'Choose a date and time that has not passed.' },
  DATE_TOO_FAR: { id: 'Tanggal terlalu jauh ke depan. Pilih tanggal yang lebih dekat.', en: 'The date is too far ahead. Choose an earlier date.' },
  DUPLICATE_NAME: { id: 'Nama ini sudah digunakan. Gunakan nama lain.', en: 'This name is already in use. Use a different name.' },
  MAP_LINK_UNREADABLE: { id: 'Link ini nggak kebaca. Salin ulang dari tombol Bagikan di Google Maps.', en: "We couldn't read this link. Copy it again from Share in Google Maps." },
}

// The UI-SPEC price sentence is more specific than the generic integer message.
const fieldOverrides: Partial<Record<string, Partial<Record<FieldErrorCode, Message>>>> = {
  priceIdr: { INVALID_INTEGER: { id: 'Masukkan harga rupiah berupa angka bulat yang valid.', en: 'Enter a valid whole-number rupiah price.' } },
}

export function fieldErrorMessage(field: string, code: FieldErrorCode): Message {
  return fieldOverrides[field]?.[code] ?? fieldErrorMessages[code]
}
