import { expect, test } from '@playwright/test'
import { e2eAdminEmail, e2eAdminPassword } from './support/e2e-credentials.ts'
import { addClubDays, clubToday } from '../../shared/club-time.ts'
import { publishSession, signInAdmin } from './support/admin-api.ts'
import { expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'

test('admin signs in from Club, reads a dated published session, and signs out with server revocation', async ({ page, request }) => {
  const auth = await signInAdmin(request)
  const date = addClubDays(clubToday(), 15)
  const published = await publishSession(request, auth, { date })
  await page.goto('/club')
  await page.getByRole('link', { name: 'Masuk admin' }).click()
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(e2eAdminEmail)
  await page.getByLabel('Kata sandi', { exact: true }).fill(e2eAdminPassword)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/sessions$/)
  await page.goto('/admin/sessions?date=' + date)
  await expect(page.getByRole('heading', { name: published.session.className })).toBeVisible()
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/sign-in$/)
  expect((await page.request.get('/api/admin/sessions')).status()).toBe(401)
})

test('signed-out protected navigation explains access and returns to the requested date after sign-in', async ({ page }) => {
  const path = '/admin/sessions?date=' + addClubDays(clubToday(), 4)
  await page.goto(path)
  await expect(page.getByText('Masuk sebagai admin untuk mengelola jadwal.')).toBeVisible()
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(e2eAdminEmail)
  await page.getByLabel('Kata sandi', { exact: true }).fill(e2eAdminPassword)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'))
})

test('E5 empty and partial form errors are associated, focused, and preserve email', async ({ page }) => {
  await page.goto('/admin/sign-in')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  const email = page.getByRole('textbox', { name: 'Email', exact: true })
  await expect(email).toBeFocused()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveAttribute('aria-describedby', /error/)
  await email.fill(e2eAdminEmail)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(email).toHaveValue(e2eAdminEmail)
  await expect(email).not.toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByLabel('Kata sandi', { exact: true })).toBeFocused()
})

test('E5 error clears password, preserves email, and distinguishes network failure', async ({ page }) => {
  await page.goto('/admin/sign-in')
  await page.route('**/api/admin/auth/sign-in', route => route.fulfill({ status: 401, json: { error: { code: 'SIGN_IN_FAILED' } } }))
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(e2eAdminEmail)
  await page.getByLabel('Kata sandi', { exact: true }).fill('invalid-test-password')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Email atau kata sandi tidak cocok')
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue(e2eAdminEmail)
  await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveValue('')
  await page.unroute('**/api/admin/auth/sign-in')
  await page.route('**/api/admin/auth/sign-in', route => route.abort())
  await page.getByLabel('Kata sandi', { exact: true }).fill('test-only-password')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Belum dapat masuk. Coba lagi.')
})

test('E5 loading prevents duplicate requests and throttle exposes retry timing', async ({ page }) => {
  let requests = 0
  let release: () => void = () => {}
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/admin/auth/sign-in', async route => {
    requests += 1
    await gate
    await route.fulfill({ status: 429, json: { error: { code: 'SIGN_IN_THROTTLED', retryAfterSeconds: 90 } } })
  })
  await page.goto('/admin/sign-in')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(e2eAdminEmail)
  await page.getByLabel('Kata sandi', { exact: true }).fill('test-only-password')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  const pending = page.getByRole('button', { name: 'Sedang masuk...' })
  await expect(pending).toBeDisabled()
  await page.getByLabel('Kata sandi', { exact: true }).press('Enter')
  expect(requests).toBe(1)
  release()
  await expect(page.getByRole('alert')).toContainText('2 menit')
  await expect(page.getByRole('button', { name: 'Masuk', exact: true })).toBeDisabled()
})

test('E4 expiry recovers at the same dated destination, and sign-out failure does not fake success', async ({ page }) => {
  await page.goto('/admin/sign-in')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(e2eAdminEmail)
  await page.getByLabel('Kata sandi', { exact: true }).fill(e2eAdminPassword)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/sessions$/)
  await page.route('**/api/admin/sessions?**', route => route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED' } } }))
  await page.getByRole('button', { name: 'Tanggal berikutnya', exact: true }).click()
  await expect(page.getByText('Sesi admin berakhir. Masuk lagi untuk melanjutkan.')).toBeVisible()
  const destination = page.url()
  await page.unroute('**/api/admin/sessions?**')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(e2eAdminEmail)
  await page.getByLabel('Kata sandi', { exact: true }).fill(e2eAdminPassword)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page.getByRole('navigation', { name: 'Navigasi admin' })).toBeVisible()
  await expect(page).toHaveURL(destination)
  await page.route('**/api/admin/auth/sign-out', route => route.abort())
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Belum dapat keluar. Coba lagi.')
  await expect(page.getByRole('navigation', { name: 'Navigasi admin' })).toBeVisible()
})

test('E5 long-text, language switching, show/hide password and narrow-screen input preservation', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/admin/sign-in')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(e2eAdminEmail)
  await page.getByLabel('Kata sandi', { exact: true }).fill('test-only-password')
  await page.getByRole('button', { name: 'Tampilkan kata sandi' }).click()
  await expect(page.getByLabel('Kata sandi', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: /ID, Bahasa/ }).click()
  await page.getByRole('radio', { name: 'English', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue(e2eAdminEmail)
  await page.getByRole('button', { name: 'Hide password' }).click()
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password')
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await page.getByRole('button', { name: 'Sign in', exact: true }).scrollIntoViewIfNeeded()
  await expectNoHorizontalScroll(page)
  await expectTouchTargets(page)
})
