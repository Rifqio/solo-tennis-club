import { expect, test } from '@playwright/test'
import { publicFixture, scheduleFixture, fixtureDate } from './support/public-fixtures.ts'
import { english } from './support/browser-admin.ts'
for (const [availability, remaining, indonesian, englishLabel] of [['available',8,'Tersedia','Available'],['nearly_full',1,'Hampir penuh','Nearly full'],['full',0,'Penuh','Full'],['cancelled',8,'Dibatalkan','Cancelled']] as const) {
  test(`availability ${availability} is readable in row and detail in both languages`, async ({ page }) => {
    const fixture = publicFixture('statusfixture', { availability, remainingPlaces: remaining })
    await page.route('**/api/public/schedule**', route => route.fulfill({ json: scheduleFixture([fixture]) }))
    await page.route('**/api/public/sessions/*', route => route.fulfill({ json: fixture }))
    await page.goto('/schedule?date=' + fixtureDate)
    await expect(page.getByText(indonesian, { exact: true }).first()).toBeVisible()
    await english(page); await expect(page.getByText(englishLabel, { exact: true }).first()).toBeVisible()
    await page.getByRole('button', { name: /Contoh kelas statusfixture/ }).click()
    // Desktop shows the detail in the side panel; phones and tablets open it as a sheet.
    const dialog = (page.viewportSize()?.width ?? 0) >= 1024 ? page.getByRole('complementary', { name: 'Session details' }) : page.getByRole('dialog')
    await expect(dialog.getByText(englishLabel, { exact: true }).first()).toBeVisible()
    if (availability === 'cancelled') await expect(dialog).toContainText('This session is cancelled')
    await expect(dialog).toContainText('150,000')
  })
}
