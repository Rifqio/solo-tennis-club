import { expect, test } from '@playwright/test'
import { addClubDays, clubToday } from '../../shared/club-time.ts'
import { browserSignIn, chooseOption, english, expectDuration, setDuration, pickCoaches, expectToast } from './support/browser-admin.ts'
import { getSessionOptions, publishSession, signInAdmin } from './support/admin-api.ts'
import { expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'
import { sessionDetail } from './support/session-detail.ts'
import type { AdminSessionDetail } from '../../shared/api/admin-sessions.ts'
test('guided session publish: editable defaults, back/continue, review all coaches, repeat-safe retry, public details', async ({ page, request, browser }) => {
  const auth = await signInAdmin(request); const options = await getSessionOptions(request)
  const date = addClubDays(clubToday(),181)
  await browserSignIn(page); await page.goto('/admin/sessions/new?date=' + date)
  await chooseOption(page, 'Kelas', options.classes[0].name)
  await page.getByLabel('Waktu mulai (WIB)', { exact: true }).fill('06:30')
  await expectDuration(page, String(options.classes[0].defaults.durationMinutes))
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await expect(page.getByText('Langkah 2 dari 4', { exact: true })).toBeVisible()
  await pickCoaches(page, options.coaches.slice(0,2).map(coach => coach.name))
  await page.getByRole('button', { name: 'Kembali', exact: true }).click(); await expect(page.getByLabel('Waktu mulai (WIB)', { exact: true })).toHaveValue('06:30')
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click(); await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await page.getByLabel('Harga per slot', { exact: true }).fill('175000')
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click(); await expect(page.getByText('Langkah 4 dari 4', { exact: true })).toBeVisible()
  for (const coach of options.coaches.slice(0,2)) await expect(page.getByText(coach.name, { exact: true })).toBeVisible()
  let saved: AdminSessionDetail | null = null; let requests = 0
  await page.route('**/api/admin/sessions', async route => {
    if (route.request().method() !== 'POST') return route.continue()
    requests++
    const response = await route.fetch(); saved = (await response.json()).session
    await route.abort()
  })
  await page.getByRole('button', { name: 'Simpan dan tampilkan sesi', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Isian tetap tersedia')
  await page.unroute('**/api/admin/sessions'); await page.getByRole('button', { name: 'Simpan dan tampilkan sesi', exact: true }).click()
  await expectToast(page, 'Sesi tersimpan dan tampil di jadwal.'); expect(requests).toBe(1)
  const listResponse = await request.get('/api/admin/sessions?date=' + date)
  const list = await listResponse.json(); expect(list.sessions.filter((row: { id: string }) => row.id === (saved as unknown as AdminSessionDetail).id)).toHaveLength(1)
  const visitor = await browser.newContext(); const publicPage = await visitor.newPage()
  // Opened by id: both projects publish the same class at 06:30 on this date into the shared database.
  await publicPage.goto(`/schedule?date=${date}&session=${(saved as unknown as AdminSessionDetail).id}`)
  const detail = sessionDetail(publicPage)
  await expect(detail).toContainText('175.000'); for (const coach of options.coaches.slice(0,2)) await expect(detail).toContainText(coach.name)
  await visitor.close(); void auth
})
test('safe edit retains local values on conflict; explicit latest replacement recovers; 320px actions remain reachable', async ({ page, request }) => {
  const auth = await signInAdmin(request); const created = await publishSession(request, auth, { date: addClubDays(clubToday(),185) })
  await page.setViewportSize({ width: 320, height: 568 }); await browserSignIn(page)
  await page.goto(`/admin/sessions/${created.session.id}/edit`)
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click(); await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await page.getByLabel('Harga per slot', { exact: true }).fill('180000'); await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await page.route(`**/api/admin/sessions/${created.session.id}`, route => route.request().method() === 'PUT' ? route.fulfill({ status: 409, json: { error: { code: 'STALE_VERSION', latest: { ...created.session, version: 2, priceIdr: 190000 } } } }) : route.continue())
  await page.getByRole('button', { name: 'Simpan perubahan sesi', exact: true }).click()
  await expect(page.getByText('Isian Anda', { exact: true })).toBeVisible(); await expect(page.getByText(/180\.000/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Gunakan versi terbaru', exact: true }).click()
  await page.getByRole('button', { name: 'Lanjut', exact: true }).click(); await page.getByRole('button', { name: 'Lanjut', exact: true }).click()
  await expect(page.getByLabel('Harga per slot', { exact: true })).toHaveValue('190000')
  await expectNoHorizontalScroll(page); await expectTouchTargets(page)
})
test('E6 create draft survives reload, language switch and missing-reference detour; class overrides require confirmation', async ({ page, request }) => {
  await signInAdmin(request); const options = await getSessionOptions(request)
  const first = options.classes[0]
  const second = { ...first, id: 'secondfixture', name: 'Contoh second class', defaults: { ...first.defaults, durationMinutes: 60 } }
  const fixtures = { ...options, classes: [first,second] }
  await browserSignIn(page); await page.route('**/api/admin/session-options', route => route.fulfill({ json: fixtures }))
  await page.goto('/admin/sessions/new')
  await chooseOption(page,'Kelas',first.name); await setDuration(page, '120'); await page.getByLabel('Waktu mulai (WIB)', { exact: true }).fill('06:30')
  await chooseOption(page,'Kelas',second.name); await expect(page.getByRole('alertdialog')).toContainText('Ganti kelas?')
  await page.getByRole('button', { name: 'Pertahankan kelas' }).click(); await expectDuration(page, '120')
  await page.reload(); await expectDuration(page, '120')
  await english(page); await expectDuration(page, '120', 'en')
  await page.unroute('**/api/admin/session-options'); await page.route('**/api/admin/session-options', route => route.fulfill({ json: { ...fixtures, venues: [] } }))
  await page.reload(); await page.getByRole('main').getByRole('link', { name: 'Manage', exact: true }).click()
  // Kelola opens on its first list.
  await expect(page).toHaveURL(/\/admin\/(manage|coaches)$/)
  await page.unroute('**/api/admin/session-options'); await page.route('**/api/admin/session-options', route => route.fulfill({ json: fixtures }))
  await page.goBack(); if (page.url().endsWith('/admin/manage')) await page.goBack(); await expectDuration(page, '120', 'en')
  const draft = await page.evaluate(() => JSON.parse(sessionStorage.getItem('stc.sessionDraft')!))
  expect(draft.owner).toBeDefined(); expect(draft).not.toHaveProperty('csrfToken'); expect(draft).not.toHaveProperty('password')
})
