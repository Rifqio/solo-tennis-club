/// <reference lib="dom" />
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// Phones and tablets open the swipe intro on every load of / while ONBOARDING_ALWAYS is on; desktop never does.
// Skipping it needs the label in the expected language.
async function skipPhoneOnboarding(page: Page, label: string) {
  if ((page.viewportSize()?.width ?? 0) >= 1024) return
  await page.getByRole('dialog').getByRole('button', { name: label, exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

test('visitor opens the Club tab and switches to English, remembered on reload', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/schedule')
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  await expect(page.getByRole('heading', { name: 'Jadwal', exact: true })).toBeAttached()
  const sampleRow = page.getByRole('listitem').filter({ hasText: 'Sample tennis class' })
  await expect(sampleRow).toContainText('Rp 150.000')

  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Klub' }).click()
  await expect(page).toHaveURL(/:\d+\/$/)
  await expect(page.getByText('Tentang klub', { exact: true })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('Cerita klub segera hadir.')
  await expect(page.locator('input[type="password"]')).toHaveCount(0)

  await page.getByRole('button', { name: /^ID, / }).click()
  // Phones choose in a sheet of radios, desktop in a menu.
  await page.getByRole('radio', { name: 'English', exact: true }).or(page.getByRole('menuitemradio', { name: 'English', exact: true })).click()
  await expect(page.getByText('About the club', { exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.reload()
  // On phones the reload opens the intro first, in English.
  await skipPhoneOnboarding(page, 'Skip')
  await expect(page.getByText('About the club', { exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect(await page.evaluate(() => window.localStorage.getItem('lafu.language'))).toBe('en')

  await page.getByRole('link', { name: 'Schedule', exact: true }).click()
  const englishRow = page.getByRole('listitem').filter({ hasText: 'Sample tennis class' })
  await expect(englishRow).toContainText('Rp 150,000')
  await expect(englishRow).toContainText('18:00')
  await expect(englishRow).toContainText(/8 (slots )?left/)
  expect(errors).toEqual([])
})

test('a tampered stored language falls back to Indonesian', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('lafu.language', 'fr'))
  await page.goto('/')
  await skipPhoneOnboarding(page, 'Lewati')
  await expect(page.getByText('Tentang klub', { exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
})
