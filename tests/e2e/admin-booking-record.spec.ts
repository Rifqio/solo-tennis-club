import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { browserSignIn, english, expectToast } from './support/browser-admin.ts'
import { expectNoHorizontalScroll, expectTouchTargets, LAYOUT_WIDTHS } from './support/layout-checks.ts'

// 02-05: an admin records a WhatsApp/desk booking from the roster, then links it to the customer who verified the
// same number. The server rules are proven in tests/integration/booking-admission.test.ts; these specs cover the
// phone workflow, retry truthfulness and the link confirmation against stubbed responses.

const sessionId = 'sessionfixture'
const bookingId = 'bookingfixture'
const now = new Date()
const deadline = new Date(now.getTime() + 5 * 3600_000).toISOString()
const options = {
  sessionId, sessionVersion: 3, unitPriceIdr: 100000, remainingPlaces: 3,
  bookingClosesAt: new Date(now.getTime() + 24 * 3600_000).toISOString(), serverNow: now.toISOString(), canReserve: true,
  session: { id: sessionId, className: 'Contoh Kelas Sore', levelName: 'Contoh Level', venueName: 'Contoh Lapangan', date: '2026-10-12', startTime: '16:00', endTime: '17:30', startsAt: new Date(now.getTime() + 30 * 3600_000).toISOString(), cancelled: false },
}
function detail(linked: boolean) {
  return {
    serverNow: now.toISOString(),
    booking: {
      id: bookingId, status: 'awaiting_payment', bookerName: 'Rina WA', bookerPhone: '+6281234609999', quantity: 2, totalPriceIdr: 200000, unitPriceIdr: 100000,
      originalDeadline: deadline, createdAt: now.toISOString(), source: 'admin', participants: ['Rina', 'Dita'], version: linked ? 2 : 1,
      customer: linked ? { displayName: 'Rina Verified', phone: '+6281234609999', verifiedAt: now.toISOString() } : null,
      linked: linked ? { at: now.toISOString(), by: 'Test administrator' } : null,
      session: { id: sessionId, className: 'Contoh Kelas Sore', date: '2026-10-12', startTime: '16:00', startsAt: options.session.startsAt, cancelled: false, levelName: 'Contoh Level', venueName: 'Contoh Lapangan', endTime: '17:30' },
    },
  }
}

async function stubForm(page: Page) {
  await page.route(`**/api/admin/booking-options/${sessionId}`, route => route.fulfill({ json: options }))
  await page.route(`**/api/admin/bookings/${bookingId}`, route => route.fulfill({ json: detail(false) }))
  await page.route('**/api/admin/verified-customers?*', route => route.fulfill({ json: { customer: null } }))
}

test('record a booking in three steps on a phone, with validation, defaults and a safe retry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await browserSignIn(page)
  await stubForm(page)
  const requestIds: string[] = []
  let attempts = 0
  await page.route('**/api/admin/bookings', async route => {
    if (route.request().method() !== 'POST') return route.fallback()
    const body = route.request().postDataJSON() as { createRequestId: string; participantNames: string[]; bookerPhone: string; expectedSessionVersion: number }
    requestIds.push(body.createRequestId)
    expect(body.expectedSessionVersion).toBe(3)
    attempts++
    // The first send loses its response, as on a dropped mobile connection.
    if (attempts === 1) return route.abort('connectionreset')
    return route.fulfill({ status: attempts === 2 ? 201 : 200, json: { booking: { id: bookingId, sessionId, status: 'awaiting_payment', quantity: 2, unitPriceIdr: 100000, totalPriceIdr: 200000, createdAt: now.toISOString(), originalDeadline: deadline, participants: [] }, replayed: false, serverNow: now.toISOString() } })
  })

  await page.goto(`/admin/sessions/${sessionId}/book`)
  await expect(page.getByRole('heading', { name: 'Siapa yang pesan?' })).toBeFocused()
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await expect(page.getByText('Isi Nama pemesan.')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Nama pemesan' })).toBeFocused()
  await page.getByRole('textbox', { name: 'Nama pemesan' }).fill('Rina WA')
  await page.getByRole('textbox', { name: 'Nomor HP pemesan' }).fill('12')
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await expect(page.getByText('Format Nomor HP pemesan tidak valid.')).toBeVisible()
  await page.getByRole('textbox', { name: 'Nomor HP pemesan' }).fill('0812 3460 9999')
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Berapa orang, siapa saja?' })).toBeFocused()
  await expect(page.getByRole('textbox', { name: 'Pemain 1' })).toHaveValue('Rina WA')
  await page.getByRole('button', { name: 'Tambah pemain' }).click()
  await expect(page.getByRole('textbox', { name: 'Pemain 2' })).toHaveValue('Rina WA 2')
  await page.getByRole('textbox', { name: 'Pemain 2' }).fill('Dita')
  await expectNoHorizontalScroll(page)
  await expectTouchTargets(page)
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Cek sebelum disimpan' })).toBeFocused()
  await expect(page.getByText('+6281234609999')).toBeVisible()
  await expect(page.getByText('Slot ditahan 5 jam sejak disimpan')).toBeVisible()
  await page.getByRole('button', { name: 'Simpan booking' }).click()
  await expect(page.getByText('Koneksi putus, jadi belum pasti tersimpan.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Simpan booking' }).click()

  await expect(page).toHaveURL(new RegExp(`/admin/bookings/${bookingId}$`))
  await expectToast(page, /^Booking tercatat\. Slot ditahan sampai \d{2}:\d{2} WIB\.$/)
  // The retry reused the first request ID, so the server could replay rather than book twice.
  expect(requestIds).toHaveLength(2)
  expect(requestIds[1]).toBe(requestIds[0])
})

test('leaving a half-filled booking asks before discarding; full and closed sessions explain themselves', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await browserSignIn(page)
  await stubForm(page)
  await page.route(`**/api/admin/sessions/${sessionId}/roster`, route => route.fulfill({ json: { session: { ...options.session, date: options.session.startsAt, durationMinutes: 90, venueAddress: null, coaches: [], priceIdr: 100000, minParticipants: 2, maxParticipants: 6, status: 'scheduled' }, bookings: [], occupiedPlaces: 3, remainingPlaces: 3, serverNow: now.toISOString(), truncated: false } }))
  await page.goto(`/admin/sessions/${sessionId}/roster`)
  await page.getByRole('link', { name: 'Catat booking' }).click()
  await page.getByRole('textbox', { name: 'Nama pemesan' }).fill('Setengah')
  await page.getByRole('link', { name: 'Peserta' }).click()
  await expect(page.getByRole('alertdialog', { name: 'Buang perubahan?' })).toBeVisible()
  await page.getByRole('button', { name: 'Tetap mengedit' }).click()
  await expect(page.getByRole('textbox', { name: 'Nama pemesan' })).toHaveValue('Setengah')
  await page.getByRole('link', { name: 'Peserta' }).click()
  await page.getByRole('button', { name: 'Buang perubahan' }).click()
  await expect(page).toHaveURL(new RegExp(`/admin/sessions/${sessionId}/roster$`))

  await page.unroute(`**/api/admin/booking-options/${sessionId}`)
  await page.route(`**/api/admin/booking-options/${sessionId}`, route => route.fulfill({ json: { ...options, remainingPlaces: 0, canReserve: false } }))
  await page.goto(`/admin/sessions/${sessionId}/book`)
  await expect(page.getByText('Slot sesi ini sudah penuh.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lanjut' })).toHaveCount(0)
})

test('link the booking to the verified account only after confirming, in Indonesian and English', async ({ page }) => {
  await browserSignIn(page)
  let linked = false
  // The account exists only once "Cek lagi" is pressed. (A flag, not a request count: the lookup may be asked again
  // when the desktop drawer settles, and an aborted request still reaches the route.)
  let registered = false
  await page.route(`**/api/admin/bookings/${bookingId}`, route => route.fulfill({ json: detail(linked) }))
  await page.route('**/api/admin/verified-customers?*', route => {
    expect(new URL(route.request().url()).searchParams.get('phone')).toBe('+6281234609999')
    return route.fulfill({ json: { customer: !registered ? null : { id: 'customerfixture', displayName: 'Rina Verified', phone: '+6281234609999', verifiedAt: now.toISOString() } } })
  })
  await page.route(`**/api/admin/bookings/${bookingId}/customer-link`, route => {
    expect(route.request().method()).toBe('PUT')
    expect(route.request().postDataJSON()).toEqual({ customerId: 'customerfixture', version: 1 })
    linked = true
    return route.fulfill({ json: detail(true) })
  })

  for (const width of LAYOUT_WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    registered = false
    linked = false
    await page.goto(`/admin/bookings/${bookingId}`)
    await expect(page.getByText('Belum ada akun dengan nomor +6281234609999.')).toBeVisible()
    await expect(page.getByText('Bantu lewat pengurus klub.', { exact: false })).toBeVisible()
    registered = true
    await page.getByRole('button', { name: 'Cek lagi' }).click()
    await page.getByRole('button', { name: 'Hubungkan ke akun Rina Verified' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Hubungkan booking ke Rina Verified?' })
    await expect(dialog).toBeVisible()
    await expectNoHorizontalScroll(page)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    expect(linked).toBe(false)
    await page.getByRole('button', { name: 'Hubungkan ke akun Rina Verified' }).click()
    await page.getByRole('button', { name: 'Ya, hubungkan' }).click()
    await expect(page.getByText(/^Dihubungkan /)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Akun pemesan' })).toHaveCount(0)
  }

  linked = false
  registered = true
  await page.goto(`/admin/bookings/${bookingId}`)
  await english(page)
  await expect(page.getByRole('button', { name: 'Link to Rina Verified' })).toBeVisible()
  await expect(page.getByText('Players, price and payment deadline stay the same.', { exact: false })).toBeVisible()
})
