import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'

const challenge = {
  challengeId: '7682c5ec-3b50-4c40-ad0b-a1b30b5275a5',
  maskedPhone: '+62 •••• 7890',
  expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
  resendAt: new Date(Date.now() - 1000).toISOString(),
  serverNow: new Date().toISOString(),
  development: true,
  debugCode: '012345',
}
const customerSession = {
  customer: { id: 'customerfixture', displayName: 'Contoh Pelanggan', phone: '+6281234567890' },
  csrfToken: 'test-only-csrf',
  expiresAt: new Date(Date.now() + 86400_000).toISOString(),
}

test('phone, code and new name support keyboard entry, ID/EN, narrow layouts and private sign-out', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.route('**/api/customer/auth/session', route => route.fulfill({ status: 401, json: { error: { code: 'CUSTOMER_UNAUTHENTICATED' } } }))
  await page.route('**/api/customer/auth/profile', route => route.fulfill(route.request().method() === 'GET'
    ? { status: 401, json: { error: { code: 'CUSTOMER_UNAUTHENTICATED' } } }
    : { status: 201, json: customerSession }))
  await page.route('**/api/customer/auth/otp-challenges/current', route => route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND' } } }))
  await page.route('**/api/customer/auth/otp-challenges', route => route.fulfill({ status: 201, json: challenge }))
  await page.route('**/api/customer/auth/otp-verifications', route => route.fulfill({ json: { next: 'name', csrfToken: 'profile-csrf', expiresAt: challenge.expiresAt } }))
  await page.goto('/customer/sign-in')
  await page.getByRole('textbox', { name: 'Nomor telepon', exact: true }).fill('081234567890')
  await page.getByRole('button', { name: 'Minta kode', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Verifikasi nomor' })).toBeFocused()
  await page.getByRole('textbox', { name: 'Kode enam digit', exact: true }).fill('012345')
  await page.getByRole('button', { name: 'Verifikasi', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nama', exact: true }).fill('Contoh Pelanggan')
  await page.getByRole('button', { name: /ID, Bahasa/ }).click()
  await page.getByRole('radio', { name: 'English', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Contoh Pelanggan')
  await expectNoHorizontalScroll(page)
  await expectTouchTargets(page)
  await page.getByRole('button', { name: 'Complete account', exact: true }).click()
  await expect(page.getByText('You are signed in', { exact: true })).toBeVisible()
  await page.route('**/api/customer/auth/sign-out', route => route.abort())
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByText('Contoh Pelanggan', { exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('The request did not finish')
  await page.unroute('**/api/customer/auth/sign-out')
  await page.route('**/api/customer/auth/sign-out', route => route.fulfill({ status: 204 }))
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByText('Contoh Pelanggan', { exact: true })).not.toBeVisible()
})

test('reload resumes a challenge, verification stays explicit and return intent is constrained', async ({ page }) => {
  await page.route('**/api/customer/auth/session', route => route.fulfill({ status: 401, json: { error: { code: 'CUSTOMER_UNAUTHENTICATED' } } }))
  await page.route('**/api/customer/auth/profile', route => route.fulfill({ status: 401, json: { error: { code: 'CUSTOMER_UNAUTHENTICATED' } } }))
  await page.route('**/api/customer/auth/otp-challenges/current', route => route.fulfill({ json: challenge }))
  let checks = 0
  await page.route('**/api/customer/auth/otp-verifications', async route => {
    checks++
    await route.fulfill({ json: { next: 'complete', session: customerSession } })
  })
  await page.goto('/customer/sign-in?returnTo=' + encodeURIComponent('/club'))
  await expect(page.getByRole('textbox', { name: 'Kode enam digit' })).toHaveValue('')
  expect(checks).toBe(0)
  await page.getByRole('textbox', { name: 'Kode enam digit' }).fill('012345')
  await page.getByRole('button', { name: 'Verifikasi', exact: true }).click()
  await expect(page).toHaveURL(/\/club$/)
  expect(checks).toBe(1)
})
