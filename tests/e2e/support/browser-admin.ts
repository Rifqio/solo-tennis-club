import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { e2eAdminEmail, e2eAdminPassword } from './e2e-credentials.ts'
export async function browserSignIn(page: Page) {
  await page.goto('/admin/sign-in')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(e2eAdminEmail)
  await page.getByLabel('Kata sandi', { exact: true }).fill(e2eAdminPassword)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/sessions$/)
}
const startsWith = (text: string) => new RegExp('^' + text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)')
// Picks from a chip group (level, venue, duration) or a dropdown (class), whichever the form uses for that field.
export async function chooseOption(page: Page, label: string, name: string) {
  const combobox = page.getByRole('combobox', { name: label, exact: true })
  // The desktop venue list's legend adds "(pilih satu)" and each venue reads with its address and pin, so both
  // names are matched from the start.
  const group = page.getByRole('group', { name: startsWith(label) })
  // Wait until the form has drawn the field, whichever kind it is.
  await expect(combobox.or(group).first()).toBeVisible()
  if (!(await combobox.count())) { await group.getByRole('radio', { name: startsWith(name) }).check(); return }
  await combobox.click()
  await page.getByRole('option', { name, exact: true }).click()
  // The list animates out; a key pressed before it is gone (Escape) would still go to it.
  await expect(page.getByRole('listbox')).toBeHidden()
}
export async function english(page: Page) {
  await page.getByRole('button', { name: /ID, Bahasa/ }).click()
  const radio = page.getByRole('radio', { name: 'English', exact: true })
  if (await radio.count()) await radio.click()
  else await page.getByRole('menuitemradio', { name: 'English', exact: true }).click()
}
// Duration is a chip for 60/90/120 minutes; anything else goes through "Lainnya".
export async function setDuration(page: Page, minutes: string) {
  const group = page.getByRole('group', { name: 'Durasi', exact: true })
  const chip = group.getByRole('radio', { name: `${minutes} mnt`, exact: true })
  await expect(group).toBeVisible()
  if (await chip.count()) { await chip.check(); return }
  await group.getByRole('radio', { name: 'Lainnya', exact: true }).check()
  await page.getByLabel('Durasi (menit)').fill(minutes)
}

export async function expectDuration(page: Page, minutes: string, language: 'id' | 'en' = 'id') {
  const group = page.getByRole('group', { name: language === 'id' ? 'Durasi' : 'Duration', exact: true })
  const chip = group.getByRole('radio', { name: `${minutes} ${language === 'id' ? 'mnt' : 'min'}`, exact: true })
  // Wait for the form to draw the chips before deciding which kind of value to read.
  await expect(group).toBeVisible()
  if (await chip.count()) await expect(chip).toBeChecked()
  else await expect(page.getByLabel(language === 'id' ? 'Durasi (menit)' : 'Duration (minutes)', { exact: true })).toHaveValue(minutes)
}

// Coaches (board D10): five cards inline and every coach in the "Lihat semua coach" sheet, which has a search.
// Picks through the sheet so it works however many coaches the club has.
export async function pickCoaches(page: Page, names: string[]) {
  await page.getByRole('button', { name: /^Lihat semua coach/ }).click()
  const sheet = page.getByRole('dialog', { name: 'Pilih coach' })
  for (const name of names) {
    await sheet.getByRole('searchbox', { name: 'Cari coach' }).fill(name)
    await sheet.locator('label', { hasText: name }).getByRole('checkbox').check()
  }
  await sheet.getByRole('button', { name: 'Selesai', exact: true }).click()
  await expect(sheet).toBeHidden()
}

// A toast (G1): the pill is shown on screen and its message is announced once through the polite status.
export async function expectToast(page: Page, message: string | RegExp) {
  await expect(page.locator('[role=status][aria-live=polite].sr-only').filter({ hasText: message })).toHaveCount(1)
  await expect(page.locator('[aria-hidden=true]', { hasText: message }).last()).toBeVisible()
}
