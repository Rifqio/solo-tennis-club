import { sampleSchedulePath } from './support/sample-session.ts'
import { expect, test } from '@playwright/test'
import { sessionDetail } from './support/session-detail.ts'

test('signed-out visitor sees SQLite sample session without sign-in', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(sampleSchedulePath)
  await expect(page.getByRole('heading', { name: 'Jadwal', exact: true })).toBeAttached()
  await expect(page.getByRole('heading', { level: 2 }).first()).toContainText('WIB')
  const row = page.getByRole('listitem').filter({ hasText: 'Sample tennis class' })
  await expect(row).toContainText('18:00')
  // Cards say "Sisa 8 slot" with the state; desktop rows say "Sisa 8" and the side panel names the state.
  const desktop = (page.viewportSize()?.width ?? 0) >= 1024
  await expect(row.first()).toContainText(desktop ? 'Sisa 8' : 'Sisa 8 slot')
  await expect(desktop ? sessionDetail(page) : row).toContainText('Tersedia')
  await expect(page.getByText('Data contoh untuk pengujian, bukan jadwal klub.')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  expect(new URL(page.url()).pathname).toBe('/schedule')
  expect(errors).toEqual([])
})
