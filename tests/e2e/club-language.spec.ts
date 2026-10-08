/// <reference lib="dom" />
import { expect, test } from '@playwright/test'

test('visitor opens About Lafu and switches to English, remembered on reload', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await expect(page.getByRole('heading', { name: 'Jadwal', exact: true })).toBeVisible()
  const sampleRow = page.getByRole('listitem').filter({ hasText: 'Sample tennis class' })
  await expect(sampleRow).toContainText('Rp 150.000')

  await page.getByRole('link', { name: 'Tentang Lafu' }).click()
  await expect(page).toHaveURL(/\/club$/)
  await expect(page.getByRole('main')).toContainText('Lawu Fun Tennis Club')
  await expect(page.getByRole('main')).toContainText('Belum tersedia')
  await expect(page.locator('input[type="password"]')).toHaveCount(0)

  await page.getByRole('button', { name: 'Language: English' }).click()
  await expect(page.getByRole('heading', { name: 'About Lafu', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('button', { name: 'Language: English' })).toHaveAttribute('aria-pressed', 'true')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'About Lafu', exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.localStorage.getItem('lafu.language'))).toBe('en')

  await page.getByRole('link', { name: 'Schedule', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Schedule', exact: true })).toBeVisible()
  const englishRow = page.getByRole('listitem').filter({ hasText: 'Sample tennis class' })
  await expect(englishRow).toContainText('Rp 150,000')
  await expect(englishRow).toContainText('18:00')
  await expect(englishRow).toContainText('8 places remaining')
  expect(errors).toEqual([])
})

test('a tampered stored language falls back to Indonesian', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('lafu.language', 'fr'))
  await page.goto('/club')
  await expect(page.getByRole('heading', { name: 'Tentang Lafu', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
})
