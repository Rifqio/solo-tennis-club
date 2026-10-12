import { expect, test } from '@playwright/test'
import { clubToday, addClubDays } from '../../shared/club-time.ts'
import { publicFixture, scheduleFixture, fixtureDate } from './support/public-fixtures.ts'
import { expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'
import { nextScheduleDate } from './support/schedule-nav.ts'
test('E2 date navigation keeps URL, Today, picker and seven whole date markers consistent', async ({ page }) => {
  await page.route('**/api/public/schedule**', route => { const date = new URL(route.request().url()).searchParams.get('date') ?? clubToday(); return route.fulfill({ json: scheduleFixture([publicFixture('datefixture', { date })], { date }) }) })
  await page.goto('/schedule?date=' + fixtureDate)
  await nextScheduleDate(page, fixtureDate)
  await expect(page).toHaveURL('/schedule?date=' + addClubDays(fixtureDate,1))
  await page.getByRole('button', { name: 'Hari ini', exact: true }).click()
  await expect(page).toHaveURL('/schedule?date=' + clubToday())
  await expect(page.locator('header button[aria-pressed]')).toHaveCount(7)
  await page.getByRole('button', { name: 'Pilih tanggal', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Pilih tanggal', exact: true })).toBeFocused()
  await expectNoHorizontalScroll(page); await expectTouchTargets(page)
})
test('E2 rapid changes discard delayed responses and next-date shortcut uses the server date', async ({ page }) => {
  await page.route('**/api/public/schedule**', async route => {
    const date = new URL(route.request().url()).searchParams.get('date') ?? fixtureDate
    if (date === addClubDays(fixtureDate,1)) await new Promise(resolve => setTimeout(resolve,250))
    await route.fulfill({ json: scheduleFixture(date === fixtureDate ? [] : [publicFixture('latest', { date, className: 'Contoh ' + date })], { date, nextDate: addClubDays(fixtureDate,3) }) }).catch(() => {})
  })
  await page.goto('/schedule?date=' + fixtureDate)
  await page.getByRole('button', { name: /Lihat jadwal berikutnya/ }).click()
  await expect(page).toHaveURL('/schedule?date=' + addClubDays(fixtureDate,3))
  await page.goto('/schedule?date=' + fixtureDate)
  await nextScheduleDate(page, fixtureDate)
  await nextScheduleDate(page, addClubDays(fixtureDate, 1))
  await expect(page.getByRole('heading', { name: 'Contoh ' + addClubDays(fixtureDate,2) }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Contoh ' + addClubDays(fixtureDate,1) })).toHaveCount(0)
})
