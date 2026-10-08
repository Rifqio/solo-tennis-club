import { expect, test } from '@playwright/test'

test('signed-out visitor sees SQLite sample session without sign-in', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Jadwal', exact: true })).toBeVisible()
  const row = page.getByRole('listitem').filter({ hasText: 'Sample tennis class' })
  await expect(row).toContainText('18:00')
  await expect(row).toContainText('WIB')
  await expect(row).toContainText('Tersisa 8 tempat')
  await expect(row).toContainText('Tersedia')
  await expect(row).toContainText('Data contoh untuk pengujian, bukan jadwal klub.')
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  expect(new URL(page.url()).pathname).toBe('/')
  expect(errors).toEqual([])
})
