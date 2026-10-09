import { expect, test } from '@playwright/test'
import { addClubDays, clubToday } from '../../shared/club-time.ts'
import { browserSignIn, chooseOption, english } from './support/browser-admin.ts'
import { getSessionOptions, signInAdmin } from './support/admin-api.ts'
import { expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'

for (const width of [320, 640, 1024]) {
  test(`custom pickers and paired form actions at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 })
    await signInAdmin(request)
    const options = await getSessionOptions(request)
    await browserSignIn(page)
    await page.goto('/admin/sessions/new')
    await chooseOption(page, 'Kelas', options.classes[0].name)
    await expect(page.locator('input[type=date], input[type=time]')).toHaveCount(0)
    await page.getByRole('button', { name: 'Pilih tanggal', exact: true }).click()
    const calendar = page.getByRole('dialog')
    await expect(calendar).toBeVisible()
    const day = calendar.locator('button:not(:disabled)').filter({ hasText: /^\d{1,2}$/ }).filter({ visible: true }).first()
    await day.click()
    await expect(calendar).toBeHidden()
    await page.getByLabel('Tanggal (WIB)', { exact: true }).fill(addClubDays(clubToday(), 31))
    await page.getByRole('button', { name: 'Pilih waktu mulai (WIB)', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Gunakan waktu', exact: true })).toBeDisabled()
    await chooseOption(page, 'Jam', '23')
    await chooseOption(page, 'Menit', '07')
    await page.getByRole('button', { name: 'Gunakan waktu', exact: true }).click()
    await expect(page.getByLabel('Waktu mulai (WIB)', { exact: true })).toHaveValue('23:07')
    await expect(page.getByRole('button', { name: 'Pilih waktu mulai (WIB)', exact: true })).toBeFocused()
    await page.getByRole('button', { name: 'Pilih waktu mulai (WIB)', exact: true }).click()
    await chooseOption(page, 'Jam', '22')
    await page.keyboard.press('Escape')
    await expect(page.getByLabel('Waktu mulai (WIB)', { exact: true })).toHaveValue('23:07')
    await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
    const actions = page.locator('[data-session-actions]')
    const back = actions.getByRole('button', { name: 'Kembali', exact: true })
    const next = actions.getByRole('button', { name: 'Lanjut', exact: true })
    const backBox = await back.boundingBox(); const nextBox = await next.boundingBox()
    expect(backBox).not.toBeNull(); expect(nextBox).not.toBeNull()
    expect(Math.abs(backBox!.y - nextBox!.y)).toBeLessThan(2)
    await expect(actions.getByRole('link')).toHaveCount(0)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await back.click()
    await expect(page.getByLabel('Waktu mulai (WIB)', { exact: true })).toHaveValue('23:07')
    await english(page)
    await expect(page.getByLabel('Start time (WIB)', { exact: true })).toHaveValue('23:07')
    await expectNoHorizontalScroll(page); await expectTouchTargets(page)
  })
}
