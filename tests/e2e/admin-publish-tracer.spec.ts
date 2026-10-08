import { test, expect } from '@playwright/test'
import { signInAdmin, publishSession } from './support/admin-api.ts'
test('published session is visible to a separate signed-out browser', async ({ request, browser }) => {
  const published = await publishSession(request, await signInAdmin(request))
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4310' })
  try {
    const page = await context.newPage()
    await page.goto('/?date=' + published.session.date)
    const row = page.getByRole('listitem').filter({ hasText: published.session.className })
    await expect(row).toContainText('19:30')
    await expect(row).toContainText('WIB')
    await expect(row).toContainText('150.000')
    expect((await context.request.get('/api/admin/session-options')).status()).toBe(401)
  } finally { await context.close() }
})
