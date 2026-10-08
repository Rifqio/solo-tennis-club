/// <reference lib="dom" />
import { expect, test } from '@playwright/test'
import { expectNoHorizontalScroll, expectTouchTargets, LAYOUT_WIDTHS } from './support/layout-checks'

const languages = ['id', 'en'] as const

for (const language of languages) {
  for (const width of LAYOUT_WIDTHS) {
    test(`public pages reflow at ${width}px in ${language}`, async ({ page }) => {
      await page.addInitScript(value => window.localStorage.setItem('lafu.language', value), language)
      await page.setViewportSize({ width, height: 800 })
      for (const path of ['/', '/club']) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expectNoHorizontalScroll(page)
        await expectTouchTargets(page)
        await page.screenshot({ path: `test-results/antislop-01-03/${language}-${width}${path === '/' ? '-schedule' : '-club'}.png`, fullPage: true })
      }
    })
  }
}

test('club page survives 200% text zoom at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/club')
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await expectNoHorizontalScroll(page)
  await page.goto('/')
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await expectNoHorizontalScroll(page)
})

test('keyboard focus is visible on every header control', async ({ page }) => {
  await page.goto('/')
  for (let step = 0; step < 4; step++) {
    await page.keyboard.press('Tab')
    const outline = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement
      const style = getComputedStyle(element)
      return { tag: element.tagName, style: style.outlineStyle, width: style.outlineWidth }
    })
    expect(['A', 'BUTTON']).toContain(outline.tag)
    expect(outline.style).toBe('solid')
    expect(outline.width).toBe('2px')
  }
})

test('schedule load failure names the problem and retries', async ({ page }) => {
  let requests = 0
  await page.route('**/api/public/schedule*', async route => {
    requests++
    if (requests === 1) await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'INTERNAL' } }) })
    else await route.continue()
  })
  await page.goto('/')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Jadwal belum dapat dimuat. Coba lagi.')
  await alert.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: 'Sample tennis class' })).toBeVisible()
  expect(requests).toBe(2)
})
