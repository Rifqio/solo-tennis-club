import { expect, test } from '@playwright/test'
import { publicFixture, scheduleFixture, fixtureDate } from './support/public-fixtures.ts'
import { LAYOUT_WIDTHS, expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'
test.beforeEach(async ({ page }) => {
  await page.route('**/api/public/schedule**', route => route.fulfill({ json: scheduleFixture([publicFixture()]) }))
})
test('E3 complete detail, all coaches, language switch and close restore the originating row', async ({ page }) => {
  await page.route('**/api/public/sessions/*', route => route.fulfill({ json: publicFixture() }))
  await page.goto('/?date=' + fixtureDate)
  const row = page.getByRole('button', { name: /Contoh kelas samplefixture/ })
  await row.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Contoh pelatih satu'); await expect(dialog).toContainText('Contoh pelatih dua')
  for (const label of ['Harga per tempat', 'Minimum peserta', 'Kapasitas maksimum', 'Lokasi']) await expect(dialog.getByText(label, { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'English', exact: true }).click()
  await expect(dialog.getByText('Price per place', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape'); await expect(row).toBeFocused(); await expect(page).toHaveURL('/?date=' + fixtureDate)
})
test('E3 loading keeps Close usable; error has Retry, vanished and partial facts are truthful', async ({ page }) => {
  await page.route('**/api/public/sessions/*', route => route.abort())
  await page.goto('/?date=' + fixtureDate)
  const row = page.getByRole('button', { name: /Contoh kelas samplefixture/ })
  await row.click(); await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Detail sesi belum dapat dimuat')
  await page.unroute('**/api/public/sessions/*')
  await page.route('**/api/public/sessions/*', route => route.fulfill({ json: publicFixture('samplefixture', { coaches: [], venueName: '', remainingPlaces: undefined }) }))
  await page.getByRole('dialog').getByRole('button', { name: 'Coba lagi' }).click()
  await expect(page.getByRole('dialog')).toContainText('Informasi sesi belum lengkap')
  await page.getByRole('button', { name: 'Tutup detail sesi' }).click(); await expect(row).toBeFocused()
  await page.unroute('**/api/public/sessions/*')
  let release: () => void = () => {}; const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/public/sessions/*', async route => { await gate; await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND' } } }).catch(() => {}) })
  await row.click(); await expect(page.getByText('Memuat detail sesi...')).toBeVisible()
  await page.getByRole('button', { name: 'Tutup detail sesi' }).click(); release(); await expect(row).toBeFocused()
})
for (const width of LAYOUT_WIDTHS) test(`E3 zero/one/many, long content, focus and overflow at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 600 })
  await page.route('**/api/public/sessions/*', route => route.fulfill({ json: publicFixture('samplefixture', { coaches: Array.from({ length: 12 }, (_, index) => `Contoh ${index} ` + 'nama panjang '.repeat(8)) }) }))
  await page.goto('/?date=' + fixtureDate); await page.getByRole('button', { name: /Contoh kelas samplefixture/ }).click()
  const dialog = page.getByRole('dialog'); await expect(dialog.getByRole('listitem')).toHaveCount(12)
  await dialog.getByText('Kapasitas maksimum', { exact: true }).scrollIntoViewIfNeeded()
  await expect(dialog.getByRole('button', { name: 'Tutup detail sesi' })).toBeVisible()
  await expectNoHorizontalScroll(page); await expectTouchTargets(page, '[role=dialog] button')
  for (let index = 0; index < 5; index++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true) }
})
