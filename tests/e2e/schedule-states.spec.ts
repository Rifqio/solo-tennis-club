import { expect, test } from '@playwright/test'
import { publicFixture, scheduleFixture, fixtureDate } from './support/public-fixtures.ts'
import { LAYOUT_WIDTHS, expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'
import { english } from './support/browser-admin.ts'
test('E1 loading, failure, retry and empty are distinct; date controls remain usable', async ({ page }) => {
  let release: () => void = () => {}
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/public/schedule**', async route => { await gate; await route.fulfill({ status: 500, json: { error: { code: 'INTERNAL' } } }) })
  await page.goto('/schedule?date=' + fixtureDate)
  await expect(page.getByText(/Memuat jadwal/)).toBeAttached()
  release(); await expect(page.getByRole('alert')).toContainText('Jadwal belum dapat dimuat')
  await page.unroute('**/api/public/schedule**')
  await page.route('**/api/public/schedule**', route => route.fulfill({ json: scheduleFixture([]) }))
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
  await expect(page.getByText('Tidak ada sesi pada tanggal ini', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Lihat jadwal berikutnya/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Tanggal berikutnya', exact: true })).toBeVisible()
})
for (const count of [1,5]) test(`E1 populated and ordering: ${count} sample rows`, async ({ page }) => {
  const rows = Array.from({ length: count }, (_, index) => publicFixture('fixture' + index))
  await page.route('**/api/public/schedule**', route => route.fulfill({ json: scheduleFixture(rows) }))
  await page.goto('/schedule?date=' + fixtureDate)
  await expect(page.getByRole('heading', { level: 3 })).toHaveText(rows.map(row => row.className))
  await expect(page.getByText('Data contoh untuk pengujian, bukan jadwal klub.')).toBeVisible()
})
for (const width of LAYOUT_WIDTHS) test(`E1 partial, long text, and overflow at ${width} in both languages`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 })
  await page.route('**/api/public/schedule**', route => route.fulfill({ json: scheduleFixture([publicFixture('long', { className: 'Contoh nama kelas sangat panjang '.repeat(9), venueName: '', remainingPlaces: undefined })]) }))
  await page.goto('/schedule?date=' + fixtureDate)
  await expect(page.getByText('Belum tersedia').first()).toBeVisible()
  await expectNoHorizontalScroll(page); await expectTouchTargets(page)
  await english(page); await expect(page.getByText('Not available').first()).toBeVisible()
  await expectNoHorizontalScroll(page); await expectTouchTargets(page)
})
