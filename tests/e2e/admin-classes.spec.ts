import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { browserSignIn, chooseOption, setDuration, pickCoaches } from './support/browser-admin.ts'
import { getSessionOptions, signInAdmin } from './support/admin-api.ts'
import { LAYOUT_WIDTHS, expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'
test('class defaults form creates a persistent class with ordered coaches', async ({ page, request }) => {
  await signInAdmin(request); const options = await getSessionOptions(request)
  await browserSignIn(page); await page.goto('/admin/classes/new')
  const name = 'Contoh kelas uji ' + randomUUID()
  await page.getByLabel('Nama', { exact: true }).fill(name)
  await chooseOption(page, 'Level', options.levels[0].name); await chooseOption(page, 'Lokasi', options.venues[0].name)
  await setDuration(page, '90'); await page.getByLabel('Harga per slot').fill('150000')
  await page.getByLabel('Min pemain', { exact: true }).fill('9'); await page.getByLabel('Max pemain', { exact: true }).fill('8')
  await pickCoaches(page, options.coaches.slice(0,2).map(coach => coach.name))
  await page.getByRole('button', { name: 'Simpan kelas', exact: true }).click(); await expect(page.getByLabel('Min pemain', { exact: true })).toHaveAttribute('aria-invalid','true')
  await page.getByLabel('Min pemain', { exact: true }).fill('2'); await page.getByRole('button', { name: 'Simpan kelas', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true }).first()).toBeVisible(); await page.reload(); await expect(page.getByRole('heading', { name, exact: true }).first()).toBeVisible()
})
for (const width of LAYOUT_WIDTHS) test(`E7/E9 class form wraps and coach targets fit at ${width}`, async ({ page, request }) => {
  await signInAdmin(request); const options = await getSessionOptions(request)
  await page.setViewportSize({ width, height: 700 }); await browserSignIn(page)
  await page.route('**/api/admin/session-options', route => route.fulfill({ json: { ...options, coaches: Array.from({ length: 30 }, (_, index) => ({ id: 'fixture' + index, name: `Contoh ${index} ` + 'nama panjang '.repeat(8) })) } }))
  // Five coaches inline, all thirty in the "Lihat semua coach" sheet.
  await page.goto('/admin/classes/new'); await expect(page.getByRole('checkbox')).toHaveCount(5)
  await page.getByRole('checkbox').first().check(); await expectNoHorizontalScroll(page); await expectTouchTargets(page)
  await page.getByRole('button', { name: /^Lihat semua coach/ }).click()
  const sheet = page.getByRole('dialog', { name: 'Pilih coach' }); await expect(sheet.getByRole('checkbox')).toHaveCount(30)
  await expect(sheet.getByRole('checkbox').first()).toBeChecked()
  // Measured once the sheet has finished scaling in.
  await expectNoHorizontalScroll(page); await expect(() => expectTouchTargets(page, '[role=dialog] a, [role=dialog] button, [role=dialog] input')).toPass()
  await sheet.getByRole('button', { name: 'Selesai', exact: true }).click(); await expect(sheet).toBeHidden()
  await page.getByRole('button', { name: 'Simpan kelas', exact: true }).scrollIntoViewIfNeeded(); await expectNoHorizontalScroll(page)
})
for (const count of [0,1]) test(`E9 ${count} coach options are explicit and never silently selected`, async ({ page, request }) => {
  await signInAdmin(request); const options = await getSessionOptions(request); await browserSignIn(page)
  await page.route('**/api/admin/session-options', route => route.fulfill({ json: { ...options, coaches: options.coaches.slice(0,count) } }))
  await page.goto('/admin/classes/new')
  if (count === 0) await expect(page.getByRole('link', { name: 'Belum ada coach. Tambah dulu di Kelola.' })).toBeVisible()
  else { await expect(page.getByRole('checkbox')).toHaveCount(1); await expect(page.getByRole('checkbox')).not.toBeChecked() }
})
test('E9 loading and failure preserve selected coaches; unavailable saved coaches are flagged', async ({ page, request }) => {
  const auth = await signInAdmin(request); const options = await getSessionOptions(request)
  const defaults = options.classes[0].defaults
  const response = await request.post('/api/admin/classes', { headers: { Origin: 'http://127.0.0.1:4310', 'X-CSRF-Token': auth.csrfToken }, data: { createRequestId: randomUUID(), name: 'Contoh selection ' + randomUUID(), defaultLevelId: defaults.levelId, defaultVenueId: defaults.venueId, defaultDurationMinutes: 90, defaultPriceIdr: 150000, defaultMinParticipants: 2, defaultMaxParticipants: 8, defaultCoachIds: options.coaches.slice(0,2).map(coach => coach.id) } })
  expect(response.ok()).toBe(true); const record = await response.json()
  await browserSignIn(page)
  let release: () => void = () => {}; const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/admin/session-options', async route => { await gate; await route.fulfill({ status: 500, json: { error: { code: 'INTERNAL' } } }) })
  await page.goto(`/admin/classes/${record.id}/edit`)
  await expect(page.getByText('Memuat pilihan...').first()).toBeVisible(); await expect(page.getByRole('checkbox').first()).toBeChecked()
  release(); await expect(page.getByText('Pilihan belum bisa dimuat. Isian kamu tetap aman.').first()).toBeVisible()
  await expect(page.getByRole('checkbox').first()).toBeChecked()
  await page.unroute('**/api/admin/session-options'); await page.route('**/api/admin/session-options', route => route.fulfill({ json: { ...options, coaches: [] } }))
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
  await expect(page.getByText('Pilihan 1 sudah nggak tersedia')).toBeVisible(); await expect(page.getByRole('checkbox').first()).toBeChecked()
})
