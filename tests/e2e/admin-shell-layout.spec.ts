import { expect, test } from '@playwright/test'
import type { AdminSessionDetail, AdminSessionListResponse } from '../../shared/api/admin-sessions.ts'
import { addClubDays, clubDateTimeToInstant, clubToday } from '../../shared/club-time.ts'
import { browserSignIn } from './support/browser-admin.ts'
import { LAYOUT_WIDTHS, expectNoHorizontalScroll, expectTouchTargets } from './support/layout-checks.ts'

const today = clubToday()
function fixture(index: number, long = false): AdminSessionDetail {
  return {
    id: 'sample-' + index, version: 1, classId: 'sample-class', className: long ? 'Contoh kelas tenis untuk pengujian dengan nama panjang '.repeat(5) : 'Contoh kelas ' + index,
    date: today, startTime: '18:00', endTime: '19:30', startsAt: clubDateTimeToInstant(today, '18:00').toISOString(), durationMinutes: 90,
    levelId: 'sample-level', levelName: 'Contoh pemula', venueId: 'sample-venue', venueName: 'Contoh lapangan', coaches: [{ id: 'sample-coach', name: 'Contoh pelatih' }],
    priceIdr: 150000, minParticipants: 4, maxParticipants: 8, remainingPlaces: 8, status: 'scheduled', isSample: true,
  }
}
function response(sessions: AdminSessionDetail[]): AdminSessionListResponse {
  return { today, date: today, minDate: today, maxDate: addClubDays(today, 365), nextDate: null, sessions, truncated: false, dayCounts: {} }
}
// A real sign-in: from 640px the rail asks the server for its own counts, which a mocked session cannot answer.
test.beforeEach(async ({ page }) => { await browserSignIn(page) })

for (const width of LAYOUT_WIDTHS) for (const language of ['id', 'en']) {
  test(`E4/E8 responsive shell at ${width}px in ${language}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('lafu.language', value), language)
    await page.setViewportSize({ width, height: 700 })
    await page.route('**/api/admin/sessions?**', route => route.fulfill({ json: response([fixture(0, true), ...Array.from({ length: 8 }, (_, i) => fixture(i + 1))]) }))
    await page.goto('/admin/sessions')
    await expect(page.getByText(language === 'id' ? 'Data contoh untuk pengujian, bukan jadwal klub.' : 'Sample data for testing, not the club schedule.')).toBeVisible()
    await expectNoHorizontalScroll(page)
    await expectTouchTargets(page)
    const nav = page.getByRole('navigation', { name: language === 'id' ? 'Navigasi admin' : 'Admin navigation' })
    // From 640px the rail: Sesi, Booking, Tambah sesi, Rekap, Kelas, Kelola (phones fold Kelas into Kelola).
    await expect(nav.getByRole('link')).toHaveCount(width < 640 ? 5 : 6)
    const last = page.getByRole('heading', { name: 'Contoh kelas 8', exact: true })
    await last.scrollIntoViewIfNeeded()
    if (width < 640) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      const listBox = await page.locator('main ul').last().boundingBox()
      const navBox = await nav.boundingBox()
      expect(listBox!.y + listBox!.height).toBeLessThanOrEqual(navBox!.y)
    }
  })
}

test('E8 loading and failures stay distinct from an empty list; retry loads real results', async ({ page }) => {
  let release: () => void = () => {}
  const gate = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/admin/sessions?**', async route => { await gate; await route.fulfill({ status: 500, json: { error: { code: 'INTERNAL' } } }) })
  await page.goto('/admin/sessions')
  await expect(page.getByText('Memuat sesi...')).toBeVisible()
  release()
  await expect(page.getByRole('alert')).toContainText('Terjadi kendala di server')
  await expect(page.getByText('Belum ada sesi pada tanggal ini.')).toHaveCount(0)
  await page.unroute('**/api/admin/sessions?**')
  await page.route('**/api/admin/sessions?**', route => route.fulfill({ json: response([fixture(1)]) }))
  await page.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(page.getByRole('heading', { name: 'Contoh kelas 1', exact: true })).toBeVisible()
})

for (const count of [0, 1, 3]) test(`E8 zero/one/many list: ${count} records`, async ({ page }) => {
  await page.route('**/api/admin/sessions?**', route => route.fulfill({ json: response(Array.from({ length: count }, (_, i) => fixture(i))) }))
  await page.goto('/admin/sessions')
  if (!count) await expect(page.getByText('Belum ada sesi pada tanggal ini.')).toBeVisible()
  else await expect(page.getByRole('heading', { name: /^Contoh kelas/ })).toHaveCount(count)
  await expect(page.getByRole('link', { name: 'Tambah sesi', exact: true })).toBeVisible()
})
