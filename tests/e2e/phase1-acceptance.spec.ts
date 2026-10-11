import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { addClubDays, clubToday } from '../../shared/club-time.ts'
import { sessionDetail } from './support/session-detail.ts'
import { browserSignIn, chooseOption, english, setDuration, pickCoaches, expectToast } from './support/browser-admin.ts'
test('Phase 1 UI-only admin setup, publication, safe edit and signed-out bilingual details', async ({ page, browser }) => {
  test.slow() // One flow through every admin screen and the public schedule.
  const suffix = randomUUID().slice(0,8)
  const coachNames = ['Contoh pelatih A ' + suffix, 'Contoh pelatih B ' + suffix]
  const venueName = 'Contoh lokasi ' + suffix; const levelName = 'Contoh level ' + suffix; const className = 'Contoh kelas ' + suffix
  await browserSignIn(page)
  for (const [path, name] of [['coaches',coachNames[0]],['coaches',coachNames[1]],['venues',venueName],['levels',levelName]]) {
    // Phones say "Simpan coach"; the desktop editor beside the list says "Simpan".
    await page.goto(`/admin/${path}/new`); await page.getByLabel(/^Nama (coach|lokasi|level)$/).fill(name)
    await page.getByRole('button', { name: /^Simpan( coach| lokasi| level)?$/ }).click(); await expectToast(page, `${name} ditambahkan.`)
  }
  await page.getByRole('navigation', { name: 'Navigasi admin' }).getByRole('link', { name: 'Kelas', exact: true }).click()
  await page.getByRole('link', { name: 'Tambah kelas', exact: true }).first().click()
  await page.getByLabel('Nama', { exact: true }).fill(className); await chooseOption(page,'Level',levelName); await chooseOption(page,'Lokasi',venueName)
  await setDuration(page, '90'); await page.getByLabel('Harga per slot', { exact: true }).fill('150000'); await page.getByLabel('Min pemain', { exact: true }).fill('2'); await page.getByLabel('Max pemain', { exact: true }).fill('8')
  await pickCoaches(page, coachNames)
  await page.getByRole('button', { name: 'Simpan kelas', exact: true }).click(); await expect(page.getByRole('heading', { name: className, exact: true }).first()).toBeVisible()
  await page.getByRole('navigation', { name: 'Navigasi admin' }).getByRole('link', { name: 'Sesi', exact: true }).click()
  await page.getByRole('link', { name: 'Tambah sesi', exact: true }).click()
  await chooseOption(page,'Kelas',className); const date = addClubDays(clubToday(),200)
  await page.getByLabel('Tanggal (WIB)').fill(date); await page.getByLabel('Waktu mulai (WIB)', { exact: true }).fill('06:30')
  for (let index = 0; index < 3; index++) await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan dan tampilkan sesi', exact: true }).click(); await expectToast(page, 'Sesi tersimpan dan tampil di jadwal.')
  const record = page.locator('li').filter({ has: page.getByRole('heading', { name: className, exact: true }) })
  // Phones edit from the row; desktop opens the saved session's roster beside the list, which carries "Ubah sesi".
  if ((page.viewportSize()?.width ?? 0) >= 1024) await page.getByRole('complementary').getByRole('link', { name: 'Ubah sesi', exact: true }).click()
  else await record.getByRole('link', { name: /^Ubah/ }).click()
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click(); await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await page.getByLabel('Harga per slot', { exact: true }).fill('175000'); await page.getByRole('button', { name: 'Lanjut', exact: true }).click(); await page.getByRole('button', { name: 'Simpan perubahan sesi', exact: true }).click()
  await expectToast(page, 'Sesi tersimpan dan tampil di jadwal.')
  const visitor = await browser.newContext(); const publicPage = await visitor.newPage()
  await publicPage.goto('/schedule'); await english(publicPage)
  await publicPage.getByRole('button', { name: 'Choose date', exact: true }).click()
  const today = clubToday(); const monthCount = (Number(date.slice(0,4)) - Number(today.slice(0,4))) * 12 + Number(date.slice(5,7)) - Number(today.slice(5,7))
  for (let month = 0; month < monthCount; month++) await publicPage.getByRole('button', { name: 'Next month', exact: true }).click()
  await publicPage.locator(`[data-day="${date}"] button`).click(); await expect(publicPage).toHaveURL('/schedule?date=' + date)
  await publicPage.getByRole('button', { name: new RegExp(className) }).click()
  // A desktop visitor sees the detail in the side panel; it stays open while the language changes.
  const dialog = sessionDetail(publicPage); for (const value of [venueName,levelName,...coachNames,'175,000','Min 2 · Max 8','8 left']) await expect(dialog).toContainText(value)
  // On phones the sheet is modal, so it closes before the language changes and opens again after.
  const sheet = (publicPage.viewportSize()?.width ?? 0) < 1024
  if (sheet) { await publicPage.keyboard.press('Escape'); await expect(dialog).toBeHidden() }
  await publicPage.getByRole('button', { name: /^EN, / }).click()
  const indonesian = publicPage.getByRole('radio', { name: 'Bahasa Indonesia', exact: true })
  if (await indonesian.count()) await indonesian.click(); else await publicPage.getByRole('menuitemradio', { name: 'Bahasa Indonesia', exact: true }).click()
  if (sheet) await publicPage.getByRole('button', { name: new RegExp(className) }).click()
  await expect(dialog).toContainText('175.000'); await expect(dialog).toContainText('Sisa 8')
  await publicPage.goto('/admin/sessions'); await expect(publicPage.getByText('Masuk sebagai admin untuk mengelola jadwal.')).toBeVisible()
  await visitor.close()
})
