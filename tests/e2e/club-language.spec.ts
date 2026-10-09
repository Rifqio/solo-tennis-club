/// <reference lib="dom" />
import { expect, test } from '@playwright/test'

test('visitor opens the Club tab and switches to English, remembered on reload', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await expect(page.getByRole('heading', { name: 'Jadwal', exact: true })).toBeAttached()
  const sampleRow = page.getByRole('listitem').filter({ hasText: 'Sample tennis class' })
  await expect(sampleRow).toContainText('Rp 150.000')

  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Klub' }).click()
  await expect(page).toHaveURL(/\/club$/)
  await expect(page.getByRole('heading', { name: 'Tentang Lafu', exact: true })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('Belum tersedia')
  await expect(page.locator('input[type="password"]')).toHaveCount(0)

  await page.getByRole('button', { name: /^ID, / }).click()
  await page.getByRole('menuitemradio', { name: 'English' }).click()
  await expect(page.getByRole('heading', { name: 'About Lafu', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'About Lafu', exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.localStorage.getItem('lafu.language'))).toBe('en')

  await page.getByRole('link', { name: 'Schedule', exact: true }).click()
  const englishRow = page.getByRole('listitem').filter({ hasText: 'Sample tennis class' })
  await expect(englishRow).toContainText('Rp 150,000')
  await expect(englishRow).toContainText('18:00')
  await expect(englishRow).toContainText('8 slots left')
  expect(errors).toEqual([])
})

test('a tampered stored language falls back to Indonesian', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('lafu.language', 'fr'))
  await page.goto('/club')
  await expect(page.getByRole('heading', { name: 'Tentang Lafu', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
})
