import { expect, test } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'
import { publishSession, signInAdmin } from './support/admin-api.ts'
import { browserSignIn, english } from './support/browser-admin.ts'
import { expectNoHorizontalScroll } from './support/layout-checks.ts'

// Phase 3 acceptance (03-06): the whole payment path in a real browser against the e2e server, which runs in demo
// mode so members sign in with the code shown on screen. Each run publishes its own session, so the places it books
// never collide with the shared sample session.
const PROOF = 'public/icons/icon-512.png'

async function memberSignIn(page: Page, name: string) {
  await page.addInitScript(() => { try { localStorage.setItem('stc.onboarded', '1') } catch { /* private mode */ } })
  await page.goto('/customer/sign-in')
  await page.getByRole('textbox', { name: 'Nomor HP', exact: true }).fill('0812' + String(Date.now()).slice(-8))
  await page.getByRole('button', { name: 'Kirim kode', exact: true }).click()
  const code = (await page.getByRole('status').filter({ hasText: 'Kode verifikasi' }).innerText()).match(/\d{6}/)![0]
  await page.getByRole('textbox', { name: 'Kode enam digit', exact: true }).fill(code)
  await page.getByRole('button', { name: 'Verifikasi', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nama', exact: true }).fill(name)
  await page.getByRole('button', { name: 'Simpan nama', exact: true }).click()
  await expect(page).toHaveURL(/\/account$/)
}

// Books one place and returns the booking id from the result screen's pay link.
async function bookOnePlace(page: Page, sessionId: string) {
  await page.goto(`/book/${sessionId}`)
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await page.getByRole('button', { name: 'Konfirmasi booking', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Booking masuk!' })).toBeVisible()
  const href = await page.getByRole('link', { name: 'Bayar sekarang', exact: true }).getAttribute('href')
  return href!.match(/\/bookings\/([^/]+)\/pay/)![1]
}

// Phones get a full result screen with a heading; desktop confirms inside the upload card.
const proofSent = (page: Page) => expect(page.getByText('Bukti terkirim', { exact: true }).first()).toBeVisible()

async function attachProof(page: Page) {
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: /^Upload bukti bayar/ }).click()
  await (await chooser).setFiles(PROOF)
  await expect(page.getByText('icon-512.png')).toBeVisible()
}

async function adminPage(browser: Browser, page: Page) {
  const context = await browser.newContext({ viewport: page.viewportSize()!, baseURL: test.info().project.use.baseURL ?? 'http://127.0.0.1:4310' })
  const admin = await context.newPage()
  await browserSignIn(admin)
  return admin
}

test('member pays and sends proof; admin rejects, member resends, admin approves; outside payment; Rekap export', async ({ page, browser }) => {
  test.setTimeout(120_000)
  const published = await publishSession(page.request, await signInAdmin(page.request), { startTime: '07:00' })
  const sessionId = published.session.id
  const sessionMonth = published.session.date.slice(0, 7)
  const price = published.session.priceIdr
  await page.context().clearCookies()

  // Member: book, see the amount, and keep the file when the connection drops mid-upload.
  await memberSignIn(page, 'Contoh Pembayar')
  const bookingId = await bookOnePlace(page, sessionId)
  await page.goto(`/bookings/${bookingId}/pay`)
  await expect(page.getByRole('heading', { name: 'Bayar booking', level: 1 })).toBeVisible()
  await expect(page.getByText('Rp ' + price.toLocaleString('id-ID')).first()).toBeVisible()
  await page.getByRole('tab', { name: 'Transfer bank', exact: true }).click()
  await page.getByRole('tab', { name: 'QRIS', exact: true }).click()
  await attachProof(page)
  await page.route('**/api/customer/bookings/*/proofs', route => route.abort('internetdisconnected'))
  await page.getByRole('button', { name: 'Kirim bukti bayar', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByText('icon-512.png')).toBeVisible()
  await page.unroute('**/api/customer/bookings/*/proofs')
  await page.getByRole('button', { name: 'Kirim bukti bayar', exact: true }).click()
  await proofSent(page)
  await expectNoHorizontalScroll(page)

  // Admin: the proof waits in Perlu dicek; reject it as unreadable.
  const admin = await adminPage(browser, page)
  await admin.goto(`/admin/bookings/${bookingId}`)
  await expect(admin.getByRole('heading', { name: 'Bukti bayar' })).toBeVisible()
  await admin.getByRole('button', { name: 'Tolak', exact: true }).click()
  const dialog = admin.getByRole('dialog', { name: 'Tolak bukti ini?' })
  await dialog.getByRole('radio', { name: 'Bukti tidak terbaca', exact: true }).check()
  await dialog.getByRole('button', { name: 'Tolak bukti', exact: true }).click()
  await expect(dialog).toBeHidden()

  // Member: the reason shows, the deadline is the same, and a new proof can go.
  await page.goto(`/bookings/${bookingId}/pay`)
  await expect(page.getByText('Bukti sebelumnya ditolak')).toBeVisible()
  await expect(page.getByText('Buktinya nggak kebaca.')).toBeVisible()
  await attachProof(page)
  await page.getByRole('button', { name: 'Kirim bukti baru', exact: true }).click()
  await proofSent(page)

  // Admin: approve the new proof; the booking is paid.
  await admin.goto(`/admin/bookings/${bookingId}`)
  await admin.getByRole('button', { name: 'Setujui', exact: true }).click()
  await expect(admin.getByText('Lunas').first()).toBeVisible()

  // Member: Booking kamu shows it paid, in both languages.
  await page.goto('/bookings')
  await expect(page.getByText('Lunas').first()).toBeVisible()
  await english(page)
  await expect(page.getByText('Paid').first()).toBeVisible()

  // A second place, paid in cash at the court: the admin records it.
  await page.goto('/account')
  await page.getByRole('radio', { name: 'Bahasa Indonesia' }).click()
  const cashBookingId = await bookOnePlace(page, sessionId)
  await admin.goto(`/admin/bookings/${cashBookingId}`)
  await admin.getByRole('button', { name: 'Catat pembayaran', exact: true }).click()
  const record = admin.getByRole('dialog', { name: 'Catat pembayaran' })
  await expect(record.getByRole('textbox', { name: 'Jumlah (Rp)' })).toHaveValue(String(price))
  await record.getByRole('button', { name: 'Simpan pembayaran', exact: true }).click()
  await expect(record).toBeHidden()
  await expect(admin.getByText('Lunas').first()).toBeVisible()

  // Rekap: the month carries the payments, and the export is an Excel file.
  await admin.goto(`/admin/recap?month=${sessionMonth}`)
  const download = admin.waitForEvent('download')
  await admin.getByRole('link', { name: 'Ekspor ke Excel' }).first().click()
  expect((await download).suggestedFilename()).toBe(`rekap-STC-${sessionMonth}.xlsx`)
  await expectNoHorizontalScroll(admin)
  await admin.context().close()
})
