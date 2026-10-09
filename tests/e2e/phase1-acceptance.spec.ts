import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { addClubDays, clubToday } from '../../shared/club-time.ts'
import { browserSignIn, chooseOption, english } from './support/browser-admin.ts'
test('Phase 1 UI-only admin setup, publication, safe edit and signed-out bilingual details', async ({ page, browser }) => {
  const suffix = randomUUID().slice(0,8)
  const coachNames = ['Contoh pelatih A ' + suffix, 'Contoh pelatih B ' + suffix]
  const venueName = 'Contoh lokasi ' + suffix; const levelName = 'Contoh level ' + suffix; const className = 'Contoh kelas ' + suffix
  await browserSignIn(page)
  for (const [path, name] of [['coaches',coachNames[0]],['coaches',coachNames[1]],['venues',venueName],['levels',levelName]]) {
    await page.goto(`/admin/${path}/new`); await page.getByLabel('Nama', { exact: true }).fill(name)
    await page.getByRole('button', { name: 'Simpan', exact: true }).click(); await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  }
  await page.getByRole('navigation', { name: 'Navigasi admin' }).getByRole('link', { name: 'Kelas', exact: true }).click()
  await page.getByRole('link', { name: 'Tambah kelas', exact: true }).first().click()
  await page.getByLabel('Nama', { exact: true }).fill(className); await chooseOption(page,'Level',levelName); await chooseOption(page,'Lokasi',venueName)
  await page.getByLabel('Durasi (menit)').fill('90'); await page.getByLabel('Harga per slot (Rp)').fill('150000'); await page.getByLabel('Minimum peserta').fill('2'); await page.getByLabel('Kapasitas maksimum').fill('8')
  for (const name of coachNames) await page.getByLabel(name, { exact: true }).check()
  await page.getByRole('button', { name: 'Simpan', exact: true }).click(); await expect(page.getByRole('heading', { name: className, exact: true })).toBeVisible()
  await page.getByRole('navigation', { name: 'Navigasi admin' }).getByRole('link', { name: 'Sesi', exact: true }).click()
  await page.getByRole('link', { name: 'Tambah sesi', exact: true }).click()
  await chooseOption(page,'Kelas',className); const date = addClubDays(clubToday(),200)
  await page.getByLabel('Tanggal (WIB)').fill(date); await page.getByLabel('Waktu mulai (WIB)').fill('06:30')
  for (let index = 0; index < 3; index++) await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await page.getByRole('button', { name: 'Simpan dan tampilkan sesi', exact: true }).click(); await expect(page.getByText('Sesi tersimpan dan tampil di jadwal.', { exact: true })).toBeVisible()
  const record = page.locator('li').filter({ has: page.getByRole('heading', { name: className, exact: true }) })
  await record.getByRole('link', { name: /Ubah sesi/ }).click(); await page.getByRole('button', { name: 'Lanjut', exact: true }).click(); await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await page.getByLabel('Harga per slot (Rp)').fill('175000'); await page.getByRole('button', { name: 'Lanjut', exact: true }).click(); await page.getByRole('button', { name: 'Simpan perubahan sesi', exact: true }).click()
  await expect(page.getByText('Sesi tersimpan dan tampil di jadwal.', { exact: true })).toBeVisible()
  const visitor = await browser.newContext(); const publicPage = await visitor.newPage()
  await publicPage.goto('/'); await english(publicPage)
  await publicPage.getByRole('button', { name: 'Choose date', exact: true }).click()
  const today = clubToday(); const monthCount = (Number(date.slice(0,4)) - Number(today.slice(0,4))) * 12 + Number(date.slice(5,7)) - Number(today.slice(5,7))
  for (let month = 0; month < monthCount; month++) await publicPage.getByRole('button', { name: 'Next month', exact: true }).click()
  await publicPage.locator(`[data-day="${date}"] button`).click(); await expect(publicPage).toHaveURL('/?date=' + date)
  await publicPage.getByRole('button', { name: new RegExp(className) }).click()
  const dialog = publicPage.getByRole('dialog'); for (const value of [venueName,levelName,...coachNames,'175,000','Minimum participants','Maximum capacity','8 slots left']) await expect(dialog).toContainText(value)
  await dialog.getByRole('button', { name: 'Bahasa Indonesia', exact: true }).click(); await expect(dialog).toContainText('175.000'); await expect(dialog).toContainText('Minimum peserta')
  await publicPage.goto('/admin/sessions'); await expect(publicPage.getByText('Masuk sebagai admin untuk mengelola jadwal.')).toBeVisible()
  await visitor.close()
})
