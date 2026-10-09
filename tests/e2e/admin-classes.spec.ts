import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { browserSignIn, chooseOption } from './support/browser-admin.ts'
import { getSessionOptions, signInAdmin } from './support/admin-api.ts'
import { LAYOUT_WIDTHS, expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'
test('class defaults form creates a persistent class with ordered coaches and future-only explanation', async ({ page, request }) => {
  await signInAdmin(request); const options = await getSessionOptions(request)
  await browserSignIn(page); await page.goto('/admin/classes/new')
  const name = 'Contoh kelas uji ' + randomUUID()
  await expect(page.getByText('Perubahan nilai awal hanya berlaku untuk sesi baru. Sesi yang sudah ada tetap sama.')).toBeVisible()
  await page.getByLabel('Nama', { exact: true }).fill(name)
  await chooseOption(page, 'Level', options.levels[0].name); await chooseOption(page, 'Lokasi', options.venues[0].name)
  await page.getByLabel('Durasi (menit)').fill('90'); await page.getByLabel('Harga per slot (Rp)').fill('150000')
  await page.getByLabel('Minimum peserta').fill('9'); await page.getByLabel('Kapasitas maksimum').fill('8')
  for (const coach of options.coaches.slice(0,2)) await page.getByLabel(coach.name, { exact: true }).check()
  await page.getByRole('button', { name: 'Simpan', exact: true }).click(); await expect(page.getByLabel('Minimum peserta')).toHaveAttribute('aria-invalid','true')
  await page.getByLabel('Minimum peserta').fill('2'); await page.getByRole('button', { name: 'Simpan', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible(); await page.reload(); await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
})
for (const width of LAYOUT_WIDTHS) test(`E7/E9 class form wraps and coach targets fit at ${width}`, async ({ page, request }) => {
  await signInAdmin(request); const options = await getSessionOptions(request)
  await page.setViewportSize({ width, height: 700 }); await browserSignIn(page)
  await page.route('**/api/admin/session-options', route => route.fulfill({ json: { ...options, coaches: Array.from({ length: 30 }, (_, index) => ({ id: 'fixture' + index, name: `Contoh ${index} ` + 'nama panjang '.repeat(8) })) } }))
  await page.goto('/admin/classes/new'); await expect(page.getByRole('checkbox')).toHaveCount(30)
  await page.getByRole('checkbox').first().check(); await expectNoHorizontalScroll(page); await expectTouchTargets(page)
  await page.getByRole('button', { name: 'Simpan', exact: true }).scrollIntoViewIfNeeded(); await expectNoHorizontalScroll(page)
})
for (const count of [0,1]) test(`E9 ${count} coach options are explicit and never silently selected`, async ({ page, request }) => {
  await signInAdmin(request); const options = await getSessionOptions(request); await browserSignIn(page)
  await page.route('**/api/admin/session-options', route => route.fulfill({ json: { ...options, coaches: options.coaches.slice(0,count) } }))
  await page.goto('/admin/classes/new')
  if (count === 0) await expect(page.getByRole('link', { name: 'Belum ada coach. Tambahkan coach.' })).toBeVisible()
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
  await expect(page.getByText('Memuat coach...')).toBeVisible(); await expect(page.getByRole('checkbox').first()).toBeChecked()
  release(); await expect(page.getByText('Coach belum dapat dimuat. Pilihan Anda tetap tersimpan.')).toBeVisible()
  await expect(page.getByRole('checkbox').first()).toBeChecked()
  await page.unroute('**/api/admin/session-options'); await page.route('**/api/admin/session-options', route => route.fulfill({ json: { ...options, coaches: [] } }))
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
  await expect(page.getByText('Coach pilihan 1 tidak tersedia')).toBeVisible(); await expect(page.getByRole('checkbox').first()).toBeChecked()
})
