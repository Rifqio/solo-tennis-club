import writeXlsxFile from 'write-excel-file/node'
import type { Row, Sheet } from 'write-excel-file/node'
import { clubDateOf, clubTimeOf } from '../../../../shared/club-time.ts'
import type { AdminRecapResponse } from '../../../../shared/api/admin-recap.ts'
import type { RecapSession } from './recap.repository.ts'

const RUPIAH = '"Rp" #,##0'
const PERCENT = '0%'
const BOOKING_LABEL: Record<string, string> = {
  awaiting_payment: 'Belum bayar', awaiting_verification: 'Perlu dicek', needs_correction: 'Perlu perbaikan', confirmed: 'Lunas', expired: 'Lewat batas',
}
const head = (value: string) => ({ value, fontWeight: 'bold' as const })
const money = (value: number) => ({ value, type: Number, format: RUPIAH })

export function recapFileName(month: string) { return `rekap-STC-${month}.xlsx` }

// The Rekap as a workbook (OPER-13), in the admin's formal Indonesian: the summary, the per-class rows, and every
// booking of the month's sessions so the totals can be checked line by line.
export async function buildRecapWorkbook(recap: AdminRecapResponse, sessions: RecapSession[]): Promise<Buffer> {
  const ratio = recap.places.capacity ? recap.places.used / recap.places.capacity : 0
  const summary: Row[] = [
    [head('Rekap STC'), recap.month],
    ['Periode', `${recap.range.from} s.d. ${recap.range.to}${recap.partial ? ' (bulan berjalan)' : ''}`],
    [],
    [head('Pendapatan (Lunas)'), money(recap.revenueIdr)],
    ['Pembanding', recap.comparison ? `${recap.comparison.from} s.d. ${recap.comparison.to}` : '-'],
    ['Pendapatan pembanding', recap.comparison ? money(recap.comparison.revenueIdr) : '-'],
    ['Perubahan', recap.comparison ? { value: recap.comparison.changePct / 100, type: Number, format: PERCENT } : '-'],
    [],
    [head('Menunggu pembayaran'), money(recap.pending.amountIdr)],
    ['Jumlah booking menunggu', recap.pending.bookings],
    [],
    [head('Slot terisi'), { value: ratio, type: Number, format: PERCENT }],
    ['Slot terisi / tersedia', `${recap.places.used} / ${recap.places.capacity}`],
    [],
    [head('Sesi terlaksana'), recap.sessions.held],
    ['Sesi mendatang', recap.sessions.upcoming],
    ['Sesi dibatalkan', recap.sessions.cancelled],
    [],
    [head('Pendapatan 6 bulan')],
    ...recap.months.map(entry => [entry.month, money(entry.revenueIdr)] as Row),
  ]
  const classes: Row[] = [
    [head('Kelas'), head('Sesi'), head('Slot terisi'), head('Slot tersedia'), head('Terisi'), head('Pendapatan (Lunas)')],
    ...recap.classes.map(row => [row.name, row.sessions, row.used, row.capacity,
      { value: row.capacity ? row.used / row.capacity : 0, type: Number, format: PERCENT }, money(row.revenueIdr)] as Row),
  ]
  const bookings: Row[] = [
    [head('Tanggal sesi'), head('Jam'), head('Kelas'), head('Status sesi'), head('Pemesan'), head('No. HP'), head('Slot'), head('Status booking'), head('Total'), head('Dikonfirmasi')],
    ...sessions.flatMap(session => session.bookings.map(booking => [
      clubDateOf(session.startsAt), clubTimeOf(session.startsAt), session.class.name, session.status === 'cancelled' ? 'Dibatalkan' : 'Terjadwal',
      booking.bookerName, booking.bookerPhone, booking.quantity, BOOKING_LABEL[booking.status] ?? booking.status, money(booking.totalPriceIdr),
      booking.confirmedAt ? `${clubDateOf(booking.confirmedAt)} ${clubTimeOf(booking.confirmedAt)}` : '',
    ] as Row)),
  ]
  const sheets: Sheet<never>[] = [
    { sheet: 'Ringkasan', data: summary, columns: [{ width: 28 }, { width: 30 }] },
    { sheet: 'Per kelas', data: classes, columns: [{ width: 30 }, { width: 8 }, { width: 12 }, { width: 14 }, { width: 10 }, { width: 20 }] },
    { sheet: 'Booking', data: bookings, columns: [{ width: 13 }, { width: 7 }, { width: 26 }, { width: 12 }, { width: 24 }, { width: 18 }, { width: 6 }, { width: 16 }, { width: 14 }, { width: 18 }] },
  ]
  return writeXlsxFile(sheets).toBuffer()
}
