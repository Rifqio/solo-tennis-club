import type { Page } from '@playwright/test'
import { addClubDays } from '../../../shared/club-time.ts'

// Moves the public schedule one day on. Phones step with "Tanggal berikutnya"; the desktop band (board D2) has week
// arrows instead, so there the next day's tile is chosen ("Kam 21, Kamis, 21 Januari 2027, ...").
export async function nextScheduleDate(page: Page, from: string) {
  const step = page.getByRole('button', { name: 'Tanggal berikutnya', exact: true })
  if (await step.isVisible()) { await step.click(); return }
  const day = Number(addClubDays(from, 1).slice(8))
  await page.getByRole('region', { name: 'Pilih tanggal jadwal' }).getByRole('button', { name: new RegExp('^\\S+ ' + day + ', ') }).click()
}
