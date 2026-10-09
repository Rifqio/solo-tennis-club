import { expect, test } from '@playwright/test'
import { LAYOUT_WIDTHS, expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'
import { english } from './support/browser-admin.ts'
const info = { admin: { email: 'fixture@lafu.test', displayName: 'Test admin' }, csrfToken: 'test-token', expiresAt: '2099-01-01T00:00:00Z' }
test.beforeEach(async ({ page }) => { await page.route('**/api/admin/auth/session', route => route.fulfill({ json: info })) })
for (const width of LAYOUT_WIDTHS) test(`E7/E8 Manage, reference form, long name and discard at ${width} ID/EN`, async ({ page }) => {
  await page.setViewportSize({ width, height: 700 })
  await page.route('**/api/admin/coaches', route => route.fulfill({ json: [] }))
  await page.goto('/admin/manage'); await expectNoHorizontalScroll(page); await expectTouchTargets(page)
  await page.goto('/admin/coaches'); await expect(page.getByText(/Belum ada pelatih/)).toBeVisible()
  await page.getByRole('link', { name: 'Tambah pelatih', exact: true }).first().click()
  await page.getByLabel('Nama', { exact: true }).fill('Contoh nama panjang '.repeat(6))
  await english(page); await expectNoHorizontalScroll(page); await expectTouchTargets(page)
  await page.getByRole('link', { name: 'Manage', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible(); await expectNoHorizontalScroll(page)
  await page.getByRole('button', { name: 'Keep editing' }).click()
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Contoh nama panjang '.repeat(6))
})
test('E7 named pending prevents duplicate submission; backend field error preserves all input', async ({ page }) => {
  let requests = 0; let release: () => void = () => {}; const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/admin/coaches', async route => { requests++; await gate; await route.fulfill({ status: 409, json: { error: { code: 'DUPLICATE_NAME', fields: { name: 'DUPLICATE_NAME' } } } }) })
  await page.goto('/admin/coaches/new'); await page.getByLabel('Nama', { exact: true }).fill('Contoh duplicate')
  await page.getByRole('button', { name: 'Simpan', exact: true }).click(); await expect(page.getByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
  await page.getByLabel('Nama', { exact: true }).press('Enter'); expect(requests).toBe(1)
  release(); await expect(page.getByLabel('Nama', { exact: true })).toHaveAttribute('aria-invalid','true'); await expect(page.getByLabel('Nama', { exact: true })).toHaveValue('Contoh duplicate')
})
