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
// Picks from a chip group (level, venue, duration) or a dropdown (class), whichever the form uses for that field.
export async function chooseOption(page: Page, label: string, name: string) {
  const combobox = page.getByRole('combobox', { name: label, exact: true })
  const group = page.getByRole('group', { name: label, exact: true })
  // Wait until the form has drawn the field, whichever kind it is.
  await expect(combobox.or(group).first()).toBeVisible()
  if (!(await combobox.count())) { await group.getByRole('radio', { name, exact: true }).check(); return }
  await combobox.click()
  await page.getByRole('option', { name, exact: true }).click()
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
  if (await chip.count()) { await chip.check(); return }
  await group.getByRole('radio', { name: 'Lainnya', exact: true }).check()
  await page.getByLabel('Durasi (menit)').fill(minutes)
}

export async function expectDuration(page: Page, minutes: string, language: 'id' | 'en' = 'id') {
  const group = page.getByRole('group', { name: language === 'id' ? 'Durasi' : 'Duration', exact: true })
  const chip = group.getByRole('radio', { name: `${minutes} ${language === 'id' ? 'mnt' : 'min'}`, exact: true })
  if (await chip.count()) await expect(chip).toBeChecked()
  else await expect(page.getByLabel(language === 'id' ? 'Durasi (menit)' : 'Duration (minutes)', { exact: true })).toHaveValue(minutes)
}
