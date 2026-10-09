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
export async function chooseOption(page: Page, label: string, name: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click()
  await page.getByRole('option', { name, exact: true }).click()
}
export async function english(page: Page) {
  await page.getByRole('button', { name: /ID, Bahasa/ }).click()
  const radio = page.getByRole('radio', { name: 'English', exact: true })
  if (await radio.count()) await radio.click()
  else await page.getByRole('menuitemradio', { name: 'English', exact: true }).click()
}
