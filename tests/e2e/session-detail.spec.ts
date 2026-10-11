import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { publicFixture, scheduleFixture, fixtureDate } from './support/public-fixtures.ts'
import { LAYOUT_WIDTHS, expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'
import { english } from './support/browser-admin.ts'
import { sessionDetail } from './support/session-detail.ts'
test.beforeEach(async ({ page }) => {
  await page.route('**/api/public/schedule**', route => route.fulfill({ json: scheduleFixture([publicFixture()]) }))
})
// Phones get a modal sheet with a close button; desktop keeps the detail in the side panel, which has none.
const isSheet = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024
test('E3 complete detail, all coaches, language switch and close restore the originating row', async ({ page }) => {
  await page.route('**/api/public/sessions/*', route => route.fulfill({ json: publicFixture() }))
  await page.goto('/schedule?date=' + fixtureDate)
  const row = page.getByRole('button', { name: /Contoh kelas samplefixture/ })
  await row.click()
  const detail = sessionDetail(page)
  await expect(detail).toContainText('Contoh pelatih satu, Contoh pelatih dua')
  for (const label of ['Level', 'Lokasi', 'Coach']) await expect(detail.getByText(label, { exact: true })).toBeVisible()
  await expect(detail).toContainText('Grup: Minimal 2, maksimal 8 orang')
  await expect(detail).toContainText('Rp 150.000')
  if (isSheet(page)) {
    await page.keyboard.press('Escape'); await expect(row).toBeFocused(); await expect(page).toHaveURL('/schedule?date=' + fixtureDate)
  }
  await english(page)
  if (isSheet(page)) await row.click()
  await expect(detail).toContainText('Group: At least 2, at most 8 people')
  await expect(detail.getByText('Venue', { exact: true })).toBeVisible()
})
test('E3 loading keeps Close usable; error has Retry, vanished and partial facts are truthful', async ({ page }) => {
  await page.route('**/api/public/sessions/*', route => route.abort())
  await page.goto('/schedule?date=' + fixtureDate)
  const row = page.getByRole('button', { name: /Contoh kelas samplefixture/ })
  const detail = sessionDetail(page)
  // The card's summary is already on screen, so a failed load reads as partial, with a retry.
  const partial = 'Sebagian info sesi belum termuat. Cek koneksi kamu, lalu coba lagi.'
  await row.click(); await expect(detail.getByRole('status').filter({ hasText: partial })).toBeVisible()
  await page.unroute('**/api/public/sessions/*')
  await page.route('**/api/public/sessions/*', route => route.fulfill({ json: publicFixture('samplefixture', { coaches: [], venueName: '', remainingPlaces: undefined }) }))
  await detail.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(detail.getByRole('status').filter({ hasText: partial })).toBeVisible()
  // The card's own facts stay; nothing reads "undefined".
  await expect(detail).toContainText('Sisa 8'); await expect(detail).not.toContainText('undefined')
  if (!isSheet(page)) return
  await page.getByRole('button', { name: 'Tutup detail sesi' }).click(); await expect(row).toBeFocused()
  await page.unroute('**/api/public/sessions/*')
  let release: () => void = () => {}; const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/public/sessions/*', async route => { await gate; await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND' } } }).catch(() => {}) })
  // While the detail loads, the sheet already shows the card's summary and can be closed.
  await row.click(); await expect(detail).toContainText('Sisa 8')
  await page.getByRole('button', { name: 'Tutup detail sesi' }).click(); release(); await expect(row).toBeFocused()
})
for (const width of LAYOUT_WIDTHS) test(`E3 zero/one/many, long content, focus and overflow at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 600 })
  const coaches = Array.from({ length: 12 }, (_, index) => `Contoh ${index} ` + 'nama panjang '.repeat(8).trim())
  await page.route('**/api/public/sessions/*', route => route.fulfill({ json: publicFixture('samplefixture', { coaches }) }))
  await page.goto('/schedule?date=' + fixtureDate); await page.getByRole('button', { name: /Contoh kelas samplefixture/ }).click()
  const detail = sessionDetail(page); await expect(detail).toContainText(coaches[11])
  await detail.getByText('Coach', { exact: true }).scrollIntoViewIfNeeded()
  await expectNoHorizontalScroll(page)
  if (!isSheet(page)) { await expectTouchTargets(page, 'aside a, aside button'); return }
  await expect(detail.getByRole('button', { name: 'Tutup detail sesi' })).toBeVisible()
  await expectTouchTargets(page, '[role=dialog] a, [role=dialog] button')
  // The sheet takes focus once it has risen (Sheet defers it past the opening animation).
  await expect.poll(() => detail.evaluate(element => element.contains(document.activeElement))).toBe(true)
  for (let index = 0; index < 5; index++) { await page.keyboard.press('Tab'); expect(await detail.evaluate(element => element.contains(document.activeElement))).toBe(true) }
})
