import { expect, test } from '@playwright/test'
import { LAYOUT_WIDTHS, expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'
import { browserSignIn, english } from './support/browser-admin.ts'
// A real sign-in: the Kelola screens call several admin endpoints (lists, counts), so a mocked session would expire.
test.beforeEach(async ({ page }) => { await browserSignIn(page) })
for (const width of LAYOUT_WIDTHS) test(`E7/E8 Manage, reference form, long name and discard at ${width} ID/EN`, async ({ page }) => {
  await page.setViewportSize({ width, height: 700 })
  await page.route('**/api/admin/coaches?**', route => route.fulfill({ json: { items: [], nextCursor: null, total: 0 } }))
  await page.goto('/admin/manage'); await expectNoHorizontalScroll(page); await expectTouchTargets(page)
  await page.goto('/admin/coaches'); await expect(page.getByText(/Belum ada coach/)).toBeVisible()
  await page.getByRole('link', { name: 'Tambah coach', exact: true }).first().click()
  await page.getByLabel(/^Nama (coach|lokasi|level)$/).fill('Contoh nama panjang '.repeat(6))
  await english(page); await expectNoHorizontalScroll(page); await expectTouchTargets(page)
  await page.getByRole('link', { name: /^Manage( ›|$)/ }).first().click()
  await expect(page.getByRole('alertdialog')).toBeVisible(); await expectNoHorizontalScroll(page)
  await page.getByRole('button', { name: 'Keep editing' }).click()
  await expect(page.getByLabel('Coach name', { exact: true })).toHaveValue('Contoh nama panjang '.repeat(6))
})
test('E7 named pending prevents duplicate submission; backend field error preserves all input', async ({ page }) => {
  let requests = 0; let release: () => void = () => {}; const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/admin/coaches', async route => { requests++; await gate; await route.fulfill({ status: 409, json: { error: { code: 'DUPLICATE_NAME', fields: { name: 'DUPLICATE_NAME' } } } }) })
  await page.goto('/admin/coaches/new'); await page.getByLabel(/^Nama (coach|lokasi|level)$/).fill('Contoh duplicate')
  await page.getByRole('button', { name: /^Simpan( coach)?$/ }).click(); await expect(page.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
  await page.getByLabel(/^Nama (coach|lokasi|level)$/).press('Enter'); expect(requests).toBe(1)
  release(); await expect(page.getByLabel(/^Nama (coach|lokasi|level)$/)).toHaveAttribute('aria-invalid','true'); await expect(page.getByLabel(/^Nama (coach|lokasi|level)$/)).toHaveValue('Contoh duplicate')
})
